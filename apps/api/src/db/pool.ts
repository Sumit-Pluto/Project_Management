import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined
});

export async function closePool() {
  await pool.end();
}
