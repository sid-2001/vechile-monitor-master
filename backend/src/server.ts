import http from "http";
import app from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { runDefaultSeed } from "./seed/defaultSeeder";
import { initSocket } from "./socket";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

const start = async (): Promise<void> => {
  try {
    try {
    await connectDb();
      await runDefaultSeed();

    } catch (err) {
    console.error("DB/Seeder failed:", err);
  }

  const server = http.createServer(app);

   
    initSocket(server);

  
  server.listen(env.port, () => {
      
    console.log(`🚀 Server running on port ${env.port}`);
    }
  );
  } catch (err) {
    console.error("❌ Startup failed", err);
    }
};

start();