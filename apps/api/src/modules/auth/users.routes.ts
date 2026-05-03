import { Router } from "express";
import { pool } from "../../db/pool.js";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../shared/async-handler.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const search = String(req.query.search ?? "").trim();
    const result = await pool.query(
      `
        SELECT id, name, email, role, created_at
        FROM users
        WHERE $1 = '' OR name ILIKE $2 OR email ILIKE $2
        ORDER BY name ASC
        LIMIT 25
      `,
      [search, `%${search}%`]
    );

    res.json({ users: result.rows });
  })
);
