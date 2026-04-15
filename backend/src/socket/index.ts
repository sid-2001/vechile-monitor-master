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
import { vehicleLocationService } from "../services/vehicleLocation.service";

let io: Server;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    const interval = setInterval(async () => {
      try {
        const latestVehicles =
          await vehicleLocationService.getLatestLocationsOfAllVehicles();

        socket.emit("vehicleLocationBulkUpdate", latestVehicles);

      } catch (err) {
        console.error("❌ SOCKET ERROR:", err);
      }
    }, 1000);

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
      clearInterval(interval);
    });
  });

  return io;
};

export const getIo = (): Server => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};