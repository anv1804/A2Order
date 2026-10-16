import { configureSocket } from "@a2order/shared/socket-client";
configureSocket(import.meta.env.VITE_WS_URL);
export { getSocketClient, joinStoreRoom } from "@a2order/shared/socket-client";
