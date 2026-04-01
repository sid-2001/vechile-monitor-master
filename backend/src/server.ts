import http from "http";
import app from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { runDefaultSeed } from "./seed/defaultSeeder";
import { initSocket } from "./socket";

const start = async (): Promise<void> => {
  await connectDb();
  await runDefaultSeed();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(env.port, () => console.log(`Server running on port ${env.port}`));
};

start().catch((err) => {
  console.error("Startup failed", err);
  process.exit(1);
});
