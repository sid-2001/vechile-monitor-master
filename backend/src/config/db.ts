import mongoose from "mongoose";
import { env } from "./env";

export const connectDb = async (): Promise<void> => {
  await mongoose.connect(env.mongodbUri, {
    dbName: "vehicle_monitoring_system",
  });
  console.log("MongoDB connected");
};
