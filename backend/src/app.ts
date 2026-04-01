import express from "express";
import authRoutes from "./routes/authRoutes";
import baseRoutes from "./routes/baseRoutes";
import userRoutes from "./routes/userRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import vehicleLocationRoutes from "./routes/vehicleLocationRoutes";
import { authMiddleware } from "./middleware/authMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { setupSwagger } from "./config/swagger";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
setupSwagger(app);
app.use("/api/auth", authRoutes);
app.use("/api/bases", authMiddleware, baseRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/vehicles", authMiddleware, vehicleRoutes);
app.use("/api/vehicle-locations", authMiddleware, vehicleLocationRoutes);
app.use(errorMiddleware);

export default app;
