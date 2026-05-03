import { Router } from "express";
import { pool } from "../../db/pool.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { ensureProjectManager } from "../../shared/access.js";
import { ApiError, forbidden, notFound } from "../../shared/errors.js";
import { validateBody } from "../../shared/validate.js";
import { createTaskSchema, updateTaskSchema } from "./task.schemas.js";

export const taskRouter = Router();

taskRouter.use(requireAuth);

async function ensureAssigneeBelongsToProject(projectId: string, assigneeId?: string | null) {
  if (!assigneeId) return;

  const result = await pool.query(
    "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, assigneeId]
  );

  if (!result.rowCount) {
    throw new ApiError(400, "Assignee must be a member of this project");
  }
}

taskRouter.post(
  "/projects/:projectId/tasks",
  validateBody(createTaskSchema),
  asyncHandler(async (req, res) => {
    const user = (req as AuthedRequest).user;
    const projectId = String(req.params.projectId);
    await ensureProjectManager(projectId, user.id);
    await ensureAssigneeBelongsToProject(projectId, req.body.assigneeId);

    const result = await pool.query(
      `
        INSERT INTO tasks (
          project_id,
          title,
          description,
          status,
          priority,
          assignee_id,
          created_by,
          due_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        projectId,
        req.body.title,
        req.body.description,
        req.body.status,
        req.body.priority,
        req.body.assigneeId ?? null,
        user.id,
        req.body.dueDate ?? null
      ]
    );

    res.status(201).json({ task: result.rows[0] });
  })
);

taskRouter.patch(
  "/tasks/:taskId",
  validateBody(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const user = (req as AuthedRequest).user;
    const taskResult = await pool.query(
      `
        SELECT t.*, pm.role AS my_project_role, p.owner_id
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $2
        WHERE t.id = $1
      `,
      [req.params.taskId, user.id]
    );

    const task = taskResult.rows[0];
    if (!task) throw notFound("Task not found");

    const isProjectManager = task.my_project_role === "admin" || task.owner_id === user.id;
    const isAssignee = task.assignee_id === user.id;

    if (!isProjectManager && !isAssignee) {
      throw forbidden("Only project admins or the assigned member can update this task");
    }

    const requestedFields = Object.keys(req.body);

    if (!isProjectManager) {
      const statusOnly = requestedFields.length === 1 && requestedFields[0] === "status";
      if (!statusOnly) {
        throw forbidden("Members can only update the status of their own tasks");
      }
    }

    if (isProjectManager) {
      await ensureAssigneeBelongsToProject(task.project_id, req.body.assigneeId);
    }

    const next = {
      title: req.body.title ?? task.title,
      description: req.body.description ?? task.description,
      status: req.body.status ?? task.status,
      priority: req.body.priority ?? task.priority,
      assigneeId:
        Object.prototype.hasOwnProperty.call(req.body, "assigneeId")
          ? req.body.assigneeId
          : task.assignee_id,
      dueDate:
        Object.prototype.hasOwnProperty.call(req.body, "dueDate")
          ? req.body.dueDate
          : task.due_date
    };

    const result = await pool.query(
      `
        UPDATE tasks
        SET title = $1,
            description = $2,
            status = $3,
            priority = $4,
            assignee_id = $5,
            due_date = $6,
            updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `,
      [
        next.title,
        next.description,
        next.status,
        next.priority,
        next.assigneeId,
        next.dueDate,
        req.params.taskId
      ]
    );

    res.json({ task: result.rows[0] });
  })
);

taskRouter.delete(
  "/tasks/:taskId",
  asyncHandler(async (req, res) => {
    const user = (req as AuthedRequest).user;
    const taskResult = await pool.query("SELECT project_id FROM tasks WHERE id = $1", [
      req.params.taskId
    ]);

    const task = taskResult.rows[0];
    if (!task) throw notFound("Task not found");

    await ensureProjectManager(task.project_id, user.id);
    await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.taskId]);
    res.status(204).send();
  })
);
