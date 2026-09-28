import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { SocketEvents } from "@a2order/shared";

let io: SocketIOServer | null = null;

// Lưu trữ latency & telemetry tạm thời theo từng quán
interface StorePingStat {
  storeId: string;
  socketId: string;
  latencyMs: number;
  lastPingAt: number;
}
const activeStorePings = new Map<string, StorePingStat>();

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    let currentStoreId: string | null = null;

    // Client tham gia vào Room riêng biệt của Quán mình
    socket.on(SocketEvents.JOIN_STORE, (storeId: string) => {
      if (storeId) {
        currentStoreId = storeId;
        const roomName = `store:${storeId}`;
        socket.join(roomName);
        console.log(`[Socket] Client ${socket.id} joined ${roomName}`);
      }
    });

    // Đo tốc độ đường truyền (Heartbeat Ping/Pong) cho Super Admin & Quán
    socket.on(SocketEvents.PING, (timestamp: number) => {
      const now = Date.now();
      const latencyMs = Math.max(1, now - timestamp);
      if (currentStoreId) {
        activeStorePings.set(socket.id, {
          storeId: currentStoreId,
          socketId: socket.id,
          latencyMs,
          lastPingAt: now,
        });
      }
      socket.emit(SocketEvents.PONG, { clientSentAt: timestamp, serverTime: now, latencyMs });
    });

    socket.on("disconnect", () => {
      activeStorePings.delete(socket.id);
      console.log(`[Socket] Client ${socket.id} disconnected`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo!");
  }
  return io;
}

/**
 * Lấy báo cáo thống kê Telemetry tốc độ đường truyền cho Super Admin
 */
export function getStoreTelemetryStats(storeId?: string) {
  const stats = Array.from(activeStorePings.values());
  if (storeId) {
    return stats.filter((s) => s.storeId === storeId);
  }
  return stats;
}

/**
 * Phát sự kiện thời gian thực chỉ đến các thiết bị trong cùng 1 nhà hàng
 */
export function emitToStore(storeId: string, event: string, payload: unknown) {
  if (io) {
    io.to(`store:${storeId}`).emit(event, payload);
  }
}
