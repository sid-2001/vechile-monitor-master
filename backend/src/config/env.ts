import dotenv from "dotenv";

dotenv.config();

console.log(process.env.MONGODB_URI)
export const env = {
  port: Number(process.env.PORT || 5000),
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "your_secret",
  redisUrl: process.env.REDIS_URL || "",
  redisLiveTtlSeconds: Number(process.env.REDIS_LIVE_TTL_SECONDS || 120),
  redisHistoryTtlSeconds: Number(process.env.REDIS_HISTORY_TTL_SECONDS || 86400),
  redisHistoryLimit: Number(process.env.REDIS_HISTORY_LIMIT || 5000),
};
