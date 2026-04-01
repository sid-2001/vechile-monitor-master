import app from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { runDefaultSeed } from "./seeders/defaultSeeder";

const start = async (): Promise<void> => {
  await connectDb();
  await runDefaultSeed();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start().catch((err) => {
  console.error("Startup failed", err);
  process.exit(1);
});
