import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { SocketEvents } from "@a2order/shared";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Cấu hình domain client trong production
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    // Client tham gia vào Room riêng biệt của Quán mình
    socket.on(SocketEvents.JOIN_STORE, (storeId: string) => {
      if (storeId) {
        const roomName = `store:${storeId}`;
        socket.join(roomName);
        console.log(`[Socket] Client ${socket.id} joined ${roomName}`);
      }
    });

    socket.on("disconnect", () => {
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
 * Phát sự kiện thời gian thực chỉ đến các thiết bị trong cùng 1 nhà hàng
 */
export function emitToStore(storeId: string, event: string, payload: unknown) {
  if (io) {
    io.to(`store:${storeId}`).emit(event, payload);
  }
}
