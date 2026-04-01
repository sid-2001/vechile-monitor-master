import { EventEmitter } from "events";
import { Server as HttpServer } from "http";

class SocketBus extends EventEmitter {
  private rooms = new Map<string, Set<string>>();
  join(client: string, room: string): void { if (!this.rooms.has(room)) this.rooms.set(room, new Set()); this.rooms.get(room)?.add(client); }
  leave(client: string, room: string): void { this.rooms.get(room)?.delete(client); }
}

let io = new SocketBus();
export const initSocket = (_server: HttpServer): SocketBus => io;
export const getIo = (): SocketBus => io;
