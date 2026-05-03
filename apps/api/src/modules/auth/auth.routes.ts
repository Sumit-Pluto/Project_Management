import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { validateBody } from "../../shared/validate.js";
import { loginSchema, signupSchema } from "./auth.schemas.js";
import { login, signup } from "./auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const result = await signup(req.body);
    res.status(201).json(result);
  })
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await login(req.body);
    res.json(result);
  })
);

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: (req as AuthedRequest).user });
});
