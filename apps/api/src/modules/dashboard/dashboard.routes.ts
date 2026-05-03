import { Router } from "express";
import { pool } from "../../db/pool.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../shared/async-handler.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthedRequest).user;

    const [summary, recentTasks, overdueTasks] = await Promise.all([
      pool.query(
        `
          SELECT
            COUNT(DISTINCT p.id)::int AS projects,
            COUNT(t.id)::int AS total_tasks,
            COUNT(t.id) FILTER (WHERE t.status = 'todo')::int AS todo,
            COUNT(t.id) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
            COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS done,
            COUNT(t.id) FILTER (
              WHERE t.due_date < CURRENT_DATE AND t.status <> 'done'
            )::int AS overdue
          FROM project_members pm
          JOIN projects p ON p.id = pm.project_id
          LEFT JOIN tasks t ON t.project_id = p.id
          WHERE pm.user_id = $1
        `,
        [user.id]
      ),
      pool.query(
        `
          SELECT
            t.id,
            t.title,
            t.status,
            t.priority,
            t.due_date,
            p.name AS project_name,
            u.name AS assignee_name
          FROM project_members pm
          JOIN tasks t ON t.project_id = pm.project_id
          JOIN projects p ON p.id = t.project_id
          LEFT JOIN users u ON u.id = t.assignee_id
          WHERE pm.user_id = $1
          ORDER BY t.updated_at DESC
          LIMIT 8
        `,
        [user.id]
      ),
      pool.query(
        `
          SELECT t.id, t.title, t.due_date, p.name AS project_name
          FROM project_members pm
          JOIN tasks t ON t.project_id = pm.project_id
          JOIN projects p ON p.id = t.project_id
          WHERE pm.user_id = $1
            AND t.due_date < CURRENT_DATE
            AND t.status <> 'done'
          ORDER BY t.due_date ASC
          LIMIT 8
        `,
        [user.id]
      )
    ]);

    res.json({
      summary: summary.rows[0],
      recentTasks: recentTasks.rows,
      overdueTasks: overdueTasks.rows
    });
  })
);
