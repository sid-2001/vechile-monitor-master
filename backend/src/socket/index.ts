// import { Server } from "socket.io";
// import { Server as HttpServer } from "http";

// let io: Server;

// export const initSocket = (server: HttpServer): Server => {
//   io = new Server(server, {
//     cors: {
//       origin: "*",
//     },
//   });

//   io.on("connection", (socket) => {
//     console.log("✅ Client connected:", socket.id);
//   });

//   return io;
// };

// export const getIo = (): Server => {
//   if (!io) {
//     throw new Error("Socket not initialized");
//   }
//   return io;
// };


import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { Types } from "mongoose";
import { vehicleLocationService } from "../services/vehicleLocation.service";
import { VehicleLocation } from "../models/VehicleLocation";

let io: Server;
let globalVehicleBroadcastInterval: NodeJS.Timeout | null = null;

type HistorySubscription = {
  key: string;
  changeStream?: any;
};

const historySubscriptions = new Map<string, HistorySubscription>();

const closeHistorySubscription = async (socketId: string) => {
  const existing = historySubscriptions.get(socketId);
  if (!existing) return;
  try {
    await existing.changeStream?.close();
  } catch (error) {
    console.error("❌ Failed to close location history stream", error);
  } finally {
    historySubscriptions.delete(socketId);
  }
};

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
    cors: { origin: "*" },
  });

  if (!globalVehicleBroadcastInterval) {
    globalVehicleBroadcastInterval = setInterval(async () => {
      try {
        const latestVehicles = await vehicleLocationService.getLatestLocationsOfAllVehicles();
        io.emit("vehicleLocationBulkUpdate", latestVehicles);
      } catch (err) {
        console.error("❌ SOCKET ERROR:", err);
      }
    }, 1000);
  }

  io.on("connection", (socket: any) => {
    console.log("✅ Client connected:", socket.id);

    socket.on("locationHistory:subscribe", async (payload: { vehicleId?: string; from?: string; to?: string }) => {
      if (!payload?.vehicleId || !payload?.from || !payload?.to) {
        socket.emit("locationHistory:error", { message: "vehicleId, from and to are required" });
        return;
      }
      if (!Types.ObjectId.isValid(payload.vehicleId)) {
        socket.emit("locationHistory:error", { message: "Invalid vehicleId" });
        return;
      }

      await closeHistorySubscription(socket.id);

      const fromDate = new Date(payload.from);
      const toDate = new Date(payload.to);
      const vehicleObjectId = new Types.ObjectId(payload.vehicleId);

      const filter = {
        vehicleId: vehicleObjectId,
        time: { $gte: fromDate, $lte: toDate }
      };

      socket.emit("locationHistory:reset", { key: `${payload.vehicleId}:${payload.from}:${payload.to}` });

      try {
        const total = await VehicleLocation.countDocuments(filter);
        socket.emit("locationHistory:start", { total });
        const cursor = VehicleLocation.find(filter).sort({ time: 1 }).cursor({ batchSize: 1000 });
        let count = 0;
        let batch: any[] = [];

        for await (const doc of cursor) {
          batch.push(doc);
          count += 1;

          if (batch.length >= 500) {
            socket.emit("locationHistory:batch", batch);
            batch = [];
            await new Promise<void>((resolve) => setImmediate(resolve));
          }
        }

        if (batch.length > 0) {
          socket.emit("locationHistory:batch", batch);
        }

        socket.emit("locationHistory:done", { count });

        const pipeline = [
          {
            $match: {
              operationType: "insert",
              "fullDocument.vehicleId": vehicleObjectId,
              "fullDocument.time": { $gte: fromDate, $lte: toDate }
            }
          }
        ];

        const changeStream = VehicleLocation.watch(pipeline, { fullDocument: "updateLookup" });
        changeStream.on("change", (change) => {
          if (change.fullDocument) {
            socket.emit("locationHistory:batch", [change.fullDocument]);
          }
        });

        historySubscriptions.set(socket.id, {
          key: `${payload.vehicleId}:${payload.from}:${payload.to}`,
          changeStream
        });
      } catch (error) {
        console.error("❌ Failed to stream location history", error);
        socket.emit("locationHistory:error", { message: "Failed to stream location history" });
      }
    });

    socket.on("locationHistory:unsubscribe", async () => {
      await closeHistorySubscription(socket.id);
    });

    socket.on("disconnect", async () => {
      console.log("❌ Client disconnected:", socket.id);
      await closeHistorySubscription(socket.id);
    });
  });

  return io;
};

export const getIo = (): Server => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};
