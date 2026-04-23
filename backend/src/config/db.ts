import mongoose from "mongoose";
import { env } from "./env";

export const connectDb = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongodbUri, {
      dbName: "vehicle_monitoring_system",
      serverSelectionTimeoutMS: 5000, // ⬅️ prevents infinite hang
    });

    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err; // let caller decide what to do
  }
};