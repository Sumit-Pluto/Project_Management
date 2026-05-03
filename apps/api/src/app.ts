import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { env, isProduction } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/auth/users.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { projectRouter } from "./modules/projects/project.routes.js";
import { taskRouter } from "./modules/tasks/task.routes.js";
import { ApiError } from "./shared/errors.js";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: isProduction ? true : env.CLIENT_URL,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/projects", projectRouter);
app.use("/api", taskRouter);
app.use("/api/dashboard", dashboardRouter);

if (isProduction) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const webDist = path.resolve(__dirname, "../../web/dist");

  app.use(express.static(webDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(webDist, "index.html"));
  });
}

app.use((_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
  }

  console.error(error);
  return res.status(500).json({ message: "Something went wrong" });
});

export { app };
