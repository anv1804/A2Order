import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import type { FastifyInstance } from "fastify";
import { SocketEvents } from "@a2order/shared";
import { verifyPrincipal, limitAttempts } from "../security/access.js";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer, app: FastifyInstance, origins: string[] = []) {
  io = new SocketIOServer(httpServer, { cors: { origin: origins, methods: ["GET", "POST"] }, maxHttpBufferSize: 100000 });
  io.use(async (socket, next) => {
    try {
      limitAttempts("socket:" + socket.handshake.address, 60);
      socket.data.principal = await verifyPrincipal(app, String(socket.handshake.auth?.token || ""));
      next();
    } catch { next(new Error("UNAUTHORIZED")); }
  });
  io.on("connection", socket => {
    const join = async () => {
      const user = await verifyPrincipal(app, String(socket.handshake.auth?.token || ""));
      socket.data.principal = user;
      for (const room of socket.rooms) if (room !== socket.id) await socket.leave(room);
      if (user.kind === "customer") await socket.join("session:" + user.sessionId);
      else await socket.join("store:" + user.storeId);
    };
    void join().catch(() => socket.disconnect(true));
    socket.use(async (_packet, next) => {
      try { await verifyPrincipal(app, String(socket.handshake.auth?.token || "")); next(); }
      catch { next(new Error("UNAUTHORIZED")); socket.disconnect(true); }
    });
    socket.on(SocketEvents.JOIN_STORE, async (storeId, acknowledge) => {
      try {
        if (storeId !== socket.data.principal.storeId) throw new Error("FORBIDDEN");
        await join();
        if (typeof acknowledge === "function") acknowledge({ success: true });
      } catch { if (typeof acknowledge === "function") acknowledge({ success: false }); }
    });
    socket.on(SocketEvents.PING, timestamp => {
      socket.emit(SocketEvents.PONG, { clientSentAt: timestamp, serverTime: Date.now() });
    });
    const timer = setInterval(() => { void verifyPrincipal(app, String(socket.handshake.auth?.token || "")).catch(() => socket.disconnect(true)); }, 30000);
    timer.unref();
    socket.once("disconnect", () => clearInterval(timer));
  });
  return io;
}

export function getSocketServer() {
  if (!io) throw new Error("Socket server is not initialized");
  return io;
}

export function getStoreTelemetryStats(storeId?: string) {
  if (!io) return [];
  return [...io.sockets.sockets.values()].filter(s => s.data.principal?.kind === "staff" && (!storeId || s.data.principal.storeId === storeId)).map(s => ({ storeId: s.data.principal.storeId, socketId: s.id, latencyMs: null, lastPingAt: null }));
}

export function emitToStore(storeId: string, event: string, payload: unknown) {
  for (const socket of io?.sockets.sockets.values() || []) {
    if (!socket.rooms.has("store:" + storeId)) continue;
    if (socket.data.principal?.role === "CHEF") {
      const value = payload as Record<string, unknown>;
      socket.emit(event, Object.fromEntries(Object.entries(value || {}).filter(([key]) => ["storeId", "tableId", "sessionId", "itemId", "orderId", "status"].includes(key))));
    } else socket.emit(event, payload);
  }
  const data = payload as { sessionId?: string; customerPhone?: string };
  if (data?.sessionId) {
    const { customerPhone: _privatePhone, ...publicPayload } = data;
    io?.to("session:" + data.sessionId).emit(event, publicPayload);
  }
}

export async function disconnectSession(sessionId: string) {
  io?.in("session:" + sessionId).disconnectSockets(true);
}
export function disconnectStaff(userId: string) {
  for (const socket of io?.sockets.sockets.values() || []) if (socket.data.principal?.kind === "staff" && socket.data.principal.userId === userId) socket.disconnect(true);
}
