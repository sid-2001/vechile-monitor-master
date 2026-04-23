import { io, Socket } from "socket.io-client";
//@ts-ignore
const {VITE_APP_BACKEND_NAME } = import.meta.env

export const socket: Socket = io(VITE_APP_BACKEND_NAME, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
});
