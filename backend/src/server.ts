import http from "http";
import dns from "dns";
import mongoose from "mongoose";

import app from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { runDefaultSeed } from "./seed/defaultSeeder";
import { initSocket } from "./socket";

// Force IPv4
dns.setDefaultResultOrder("ipv4first");

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

const start = async (): Promise<void> => {
  try {
    console.log("⏳ Connecting to MongoDB...");

    // Connect DB
    await connectDb();

    console.log("✅ MongoDB connected");
    console.log(
      "📦 Mongoose State:",
      mongoose.connection.readyState
    );

    // Run seeders  console.log("⏳ Running default seed...");
    // await runDefaultSeed();
    // console.log("⏳ Running default seed...");
    // await runDefaultSeed();

    // console.log("✅ Default seed completed");

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize socket
    initSocket(server);

    // Start server ONLY after DB connection
    server.listen(env.port, () => {
      console.log(`🚀 Server running on port ${env.port}`);
    });

  } catch (err) {
    console.error("❌ Startup failed:", err);

    // Exit app if DB connection fails
    process.exit(1);
  }
};

start();