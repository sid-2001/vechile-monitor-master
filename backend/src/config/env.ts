import dotenv from "dotenv";

dotenv.config();

console.log(process.env.MONGODB_URI)
export const env = {
  port: Number(process.env.PORT || 5000),
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "your_secret"
};
