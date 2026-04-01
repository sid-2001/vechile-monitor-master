import express from "express";
import authRoutes from "./routes/authRoutes";
import baseRoutes from "./routes/baseRoutes";
import userRoutes from "./routes/userRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import vehicleLocationRoutes from "./routes/vehicleLocationRoutes";
import deviceRoutes from "./routes/deviceRoutes";
import { authMiddleware } from "./middleware/authMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { loggingMiddleware } from "./middleware/loggingMiddleware";
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
app.use("/auth", authRoutes);
app.use("/bases", authMiddleware, baseRoutes);
app.use("/users", authMiddleware, userRoutes);
app.use("/vehicles", authMiddleware, vehicleRoutes);
app.use("/vehicle-locations", vehicleLocationRoutes);
app.use("/devices", authMiddleware, deviceRoutes);
app.use(errorMiddleware);

export default app;
