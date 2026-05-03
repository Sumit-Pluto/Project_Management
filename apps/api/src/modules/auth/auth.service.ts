import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { pool } from "../../db/pool.js";
import { ApiError } from "../../shared/errors.js";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "member";
  created_at: string;
};

export type PublicUser = Omit<UserRow, "password_hash">;

function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at
  };
}

function signToken(user: PublicUser) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "member";
}) {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [input.email]);

  if (existing.rowCount) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await pool.query<UserRow>(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, password_hash, role, created_at
    `,
    [input.name, input.email, passwordHash, input.role]
  );

  const user = toPublicUser(result.rows[0]);
  return { user, token: signToken(user) };
}

export async function login(input: { email: string; password: string }) {
  const result = await pool.query<UserRow>(
    "SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1",
    [input.email]
  );

  const user = result.rows[0];
  const passwordsMatch = user
    ? await bcrypt.compare(input.password, user.password_hash)
    : false;

  if (!user || !passwordsMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const publicUser = toPublicUser(user);
  return { user: publicUser, token: signToken(publicUser) };
}
