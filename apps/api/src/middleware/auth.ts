import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError, forbidden } from "../shared/errors.js";
import type { CurrentUser } from "../shared/access.js";

export type AuthedRequest = Request & {
  user: CurrentUser;
};

type TokenPayload = CurrentUser & {
  iat: number;
  exp: number;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    (req as AuthedRequest).user = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role
    };
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthedRequest).user;

  if (user.role !== "admin") {
    return next(forbidden("Admin access required"));
  }

  return next();
}
