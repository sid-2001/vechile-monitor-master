import { EventEmitter } from "events";
import { Server as HttpServer } from "http";
import { createHash } from "crypto";

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const encodeFrame = (data: string): Buffer => {
  const payload = Buffer.from(data);
  const length = payload.length;

  if (length < 126) {
    return Buffer.concat([Buffer.from([0x81, length]), payload]);
  }
  if (length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(length), 2);
  return Buffer.concat([header, payload]);
};

class SocketBus extends EventEmitter {
  private clients = new Set<any>();

  attachClient(socket: any): void {
    this.clients.add(socket);
    socket.on("close", () => this.clients.delete(socket));
    socket.on("error", () => this.clients.delete(socket));
  }

  broadcast(eventName: string, payload: unknown): void {
    const frame = encodeFrame(JSON.stringify({ event: eventName, payload }));
    this.clients.forEach((client) => {
      if (!client.destroyed) client.write(frame);
    });
  }

  override emit(eventName: string | symbol, ...args: any[]): boolean {
    const emitted = super.emit(eventName, ...args);
    if (typeof eventName === "string") {
      this.broadcast(eventName, args[0]);
    }
    return emitted;
  }
}

let io = new SocketBus();

export const initSocket = (server: HttpServer): SocketBus => {
  server.on("upgrade", (req, socket) => {
    if (req.url !== "/ws") {
      socket.destroy();
      return;
    }

    const key = req.headers["sec-websocket-key"];
    if (!key || Array.isArray(key)) {
      socket.destroy();
      return;
    }

    const acceptKey = createHash("sha1").update(key + WS_GUID).digest("base64");
    const responseHeaders = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "\r\n",
    ];

    socket.write(responseHeaders.join("\r\n"));
    io.attachClient(socket);
  });

  return io;
};

export const getIo = (): SocketBus => io;
