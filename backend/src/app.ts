import express from "express";
import authRoutes from "./routes/authRoutes";
import baseRoutes from "./routes/baseRoutes";
import userRoutes from "./routes/userRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import vehicleLocationRoutes from "./routes/vehicleLocationRoutes";
import deviceRoutes from "./routes/deviceRoutes";
import simMasterRoutes from "./routes/simMasterRoutes";
import { authMiddleware } from "./middleware/authMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { loggingMiddleware } from "./middleware/loggingMiddleware";
import deviceSimMappingRoutes from "./routes/deviceSimMappingRoutes";

import vehicleSOSRoutes from "./routes/vehicleSOS.routes";
import geofenceRoutes from "./routes/geofenceRoutes";
import locationRoutes from "./routes/locationRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import swaggerRoutes from "./routes/swaggerRoutes";
import vectorTileRoutes from "./routes/vectorTileRoutes";
import cors from "cors";
const app = express();

app.use(
  cors({
    origin: "*", // allow all origins (change in production)
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(loggingMiddleware);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/", swaggerRoutes);
app.use("/auth", authRoutes);
app.use("/bases", authMiddleware, baseRoutes);
app.use("/users", authMiddleware, userRoutes);
app.use("/vehicles", authMiddleware, vehicleRoutes);
app.use("/vehicle-locations", authMiddleware, vehicleLocationRoutes);
app.use("/tiles", vectorTileRoutes);
app.use("/devices", authMiddleware, deviceRoutes);
app.use("/geofences", authMiddleware, geofenceRoutes);
app.use("/locations", authMiddleware, locationRoutes);
app.use("/notifications", authMiddleware, notificationRoutes);

app.use("/sims",authMiddleware,simMasterRoutes)
app.use("/api/sos", vehicleSOSRoutes);

app.use("/device-sim-mapping", authMiddleware, deviceSimMappingRoutes);

app.use(errorMiddleware);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found", code: "NOT_FOUND" });
});



export default app;
