import { SocketEvents } from "./socket-events.js";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { getBrowserToken, getAuthUser, notifyDataChange } from "./browser.js";

let socket: Socket | null = null;
let endpoint = "";

export function configureSocket(url?: string) { endpoint = url || ""; }

export function getSocketClient(): Socket {
  if (!socket) {
    const location = window.location;
    let url = endpoint || (["3000", "3001", "3002"].includes(location.port) ? location.protocol + "//" + location.hostname + ":4000" : location.origin);
    if (!["localhost", "127.0.0.1"].includes(location.hostname)) url = url.replace(/localhost|127\.0\.0\.1/, location.hostname);
    socket = io(url, { autoConnect: false, auth: { token: getBrowserToken() }, transports: ["websocket", "polling"] });
    const reconnect = () => {
      socket!.disconnect();
      const token = getBrowserToken();
      socket!.auth = { token };
      if (token) socket!.connect();
    };
    socket.on("connect", () => { const storeId = getAuthUser()?.storeId || new URLSearchParams(location.search).get("store"); if (storeId) socket!.emit(SocketEvents.JOIN_STORE, storeId); notifyDataChange("reconnect"); });
    socket.onAny((event: string) => { if (!/ping|pong/i.test(event)) notifyDataChange("socket:" + event); });
    window.addEventListener("a2order:auth", reconnect);
    if (getBrowserToken()) socket.connect();
  }
  return socket;
}

export function joinStoreRoom(storeId: string) {
  const client = getSocketClient();
  if (client.connected) client.emit(SocketEvents.JOIN_STORE, storeId);
}
