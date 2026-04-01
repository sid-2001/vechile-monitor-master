import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  defaultAdminUsername: process.env.DEFAULT_ADMIN_USERNAME || "admin",
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123",
  defaultAdminDisplayName: process.env.DEFAULT_ADMIN_DISPLAY_NAME || "admin",
  defaultUserTimezone: process.env.DEFAULT_USER_TIMEZONE || "Asia/Kolkata"
};

if (!env.mongoUri || !env.jwtSecret) {
  throw new Error("Missing required env vars: MONGO_URI, JWT_SECRET");
}
