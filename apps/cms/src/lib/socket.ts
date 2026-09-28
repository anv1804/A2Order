import { io, Socket } from "socket.io-client";
import { SocketEvents } from "@a2order/shared";

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket) {
    const url = import.meta.env.VITE_WS_URL || "http://localhost:4000";
    socket = io(url, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("🟢 [Socket] Connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 [Socket] Disconnected");
    });
  }
  return socket;
}

export function joinStoreRoom(storeId: string) {
  const s = getSocketClient();
  s.emit(SocketEvents.JOIN_STORE, storeId);
}
