import express from "express";
import authRoutes from "./routes/authRoutes";
import baseRoutes from "./routes/baseRoutes";
import userRoutes from "./routes/userRoutes";
import roleRoutes from "./routes/roleRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import kilometerCardRoutes from './routes/kilometerCard.routes'
import vehicleLocationRoutes from "./routes/vehicleLocationRoutes";
import deviceRoutes from "./routes/deviceRoutes";
import simMasterRoutes from "./routes/simMasterRoutes";
import { authMiddleware, requireModuleAccess } from "./middleware/authMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { loggingMiddleware } from "./middleware/loggingMiddleware";
import deviceSimMappingRoutes from "./routes/deviceSimMappingRoutes";
import vehicleStopHistoryRoutes from "./routes/vehicleStopHistory.routes";
import vehicleHaltConfigRoutes from "./routes/vehicleHaltConfig.routes";
import vehicleSOSRoutes from "./routes/vehicleSOS.routes";
import geofenceRoutes from "./routes/geofenceRoutes";
import locationRoutes from "./routes/locationRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import loginDeviceRoutes from "./routes/loginDeviceRoutes";
import swaggerRoutes from "./routes/swaggerRoutes";
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
app.use("/bases", authMiddleware, requireModuleAccess("bases"), baseRoutes);
app.use("/users", authMiddleware, requireModuleAccess("users"), userRoutes);
app.use("/roles", authMiddleware, requireModuleAccess("roles"), roleRoutes);
app.use("/vehicles", authMiddleware, requireModuleAccess("vehicles"), vehicleRoutes);
app.use("/vehicle-locations", authMiddleware, requireModuleAccess("tracking"), vehicleLocationRoutes);
app.use("/devices", authMiddleware, requireModuleAccess("devices"), deviceRoutes);
app.use("/geofences", authMiddleware, requireModuleAccess("geofences"), geofenceRoutes);
app.use("/locations", authMiddleware, requireModuleAccess("locations"), locationRoutes);
app.use("/notifications", authMiddleware, notificationRoutes);
app.use("/login-devices", authMiddleware, requireModuleAccess("loginDevices"), loginDeviceRoutes);
app.use("/sims", authMiddleware, requireModuleAccess("sims"), simMasterRoutes)
app.use("/api/sos", vehicleSOSRoutes);

app.use("/device-sim-mapping", authMiddleware, requireModuleAccess("deviceSimMapping"), deviceSimMappingRoutes);
app.use('/kilometer-cards', authMiddleware, requireModuleAccess("kilometerCards"), kilometerCardRoutes)
app.use(errorMiddleware);
app.use(
  "/vehicle-stop-history",
  vehicleStopHistoryRoutes
);
app.use(
  "/vehicle-halt-config",
  vehicleHaltConfigRoutes
);
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found", code: "NOT_FOUND" });
});



export default app;
