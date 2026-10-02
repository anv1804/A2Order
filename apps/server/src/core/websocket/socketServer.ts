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

    // Chuyển tiếp đơn gọi món từ khách tới các thiết bị nhân viên/bếp của quán
    socket.on(SocketEvents.ORDER_SUBMITTED, (payload: any) => {
      const targetStore = payload?.storeId || currentStoreId;
      if (targetStore) {
        emitToStore(targetStore, SocketEvents.ORDER_SUBMITTED, payload);
      }
    });

    // Khách gửi đơn chờ quán duyệt trước khi vào bếp
    socket.on(SocketEvents.ORDER_APPROVAL_REQUESTED, (payload: any) => {
      const targetStore = payload?.storeId || currentStoreId;
      if (targetStore) {
        emitToStore(targetStore, SocketEvents.ORDER_APPROVAL_REQUESTED, payload);
      }
    });

    // Quán duyệt đơn vào bếp
    socket.on(SocketEvents.ORDER_APPROVED, (payload: any) => {
      const targetStore = payload?.storeId || currentStoreId;
      if (targetStore) {
        emitToStore(targetStore, SocketEvents.ORDER_APPROVED, payload);
      }
    });

    // Quán từ chối đơn
    socket.on(SocketEvents.ORDER_REJECTED, (payload: any) => {
      const targetStore = payload?.storeId || currentStoreId;
      if (targetStore) {
        emitToStore(targetStore, SocketEvents.ORDER_REJECTED, payload);
      }
    });

    // Khách hủy món khi chưa làm
    socket.on(SocketEvents.ORDER_ITEM_CANCELLED, (payload: any) => {
      const targetStore = payload?.storeId || currentStoreId;
      if (targetStore) {
        emitToStore(targetStore, SocketEvents.ORDER_ITEM_CANCELLED, payload);
      }
    });

    // Khách gửi yêu cầu hỗ trợ nhanh (đá, giấy, dọn bàn...)
    socket.on(SocketEvents.SERVICE_REQUESTED, (payload: any) => {
      const targetStore = payload?.storeId || currentStoreId;
      if (targetStore) {
        emitToStore(targetStore, SocketEvents.SERVICE_REQUESTED, payload);
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
