import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(24, "JWT_SECRET should be at least 24 characters"),
  CLIENT_URL: z.string().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
