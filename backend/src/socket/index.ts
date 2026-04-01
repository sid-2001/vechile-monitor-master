import { EventEmitter } from "events";
import { Server as HttpServer } from "http";

class SocketBus extends EventEmitter {}

let io = new SocketBus();

export const initSocket = (_server: HttpServer): SocketBus => io;
export const getIo = (): SocketBus => io;
