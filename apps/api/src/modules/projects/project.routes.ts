import { Router } from "express";
import { pool } from "../../db/pool.js";
import { requireAdmin, requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { ensureProjectManager, ensureProjectMember } from "../../shared/access.js";
import { ApiError, notFound } from "../../shared/errors.js";
import { validateBody } from "../../shared/validate.js";
import { addMemberSchema, createProjectSchema } from "./project.schemas.js";

export const projectRouter = Router();

projectRouter.use(requireAuth);

projectRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = (req as AuthedRequest).user;
    const result = await pool.query(
      `
        SELECT
          p.id,
          p.name,
          p.description,
          p.owner_id,
          p.created_at,
          pm.role AS my_role,
          COUNT(t.id)::int AS task_count,
          COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS done_count
        FROM projects p
        JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE pm.user_id = $1
        GROUP BY p.id, pm.role
        ORDER BY p.created_at DESC
      `,
      [user.id]
    );

    res.json({ projects: result.rows });
  })
);

projectRouter.post(
  "/",
  requireAdmin,
  validateBody(createProjectSchema),
  asyncHandler(async (req, res) => {
    const user = (req as AuthedRequest).user;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const projectResult = await client.query(
        `
          INSERT INTO projects (name, description, owner_id)
          VALUES ($1, $2, $3)
          RETURNING id, name, description, owner_id, created_at
        `,
        [req.body.name, req.body.description, user.id]
      );

      await client.query(
        `
          INSERT INTO project_members (project_id, user_id, role)
          VALUES ($1, $2, 'admin')
        `,
        [projectResult.rows[0].id, user.id]
      );

      await client.query("COMMIT");
      res.status(201).json({ project: { ...projectResult.rows[0], my_role: "admin" } });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  })
);

projectRouter.get(
  "/:projectId",
  asyncHandler(async (req, res) => {
    const user = (req as AuthedRequest).user;
    const projectId = String(req.params.projectId);
    await ensureProjectMember(projectId, user.id);

    const [projectResult, membersResult, tasksResult] = await Promise.all([
      pool.query(
        `
          SELECT p.id, p.name, p.description, p.owner_id, p.created_at, pm.role AS my_role
          FROM projects p
          JOIN project_members pm ON pm.project_id = p.id
          WHERE p.id = $1 AND pm.user_id = $2
        `,
        [projectId, user.id]
      ),
      pool.query(
        `
          SELECT u.id, u.name, u.email, pm.role, pm.joined_at
          FROM project_members pm
          JOIN users u ON u.id = pm.user_id
          WHERE pm.project_id = $1
          ORDER BY pm.role ASC, u.name ASC
        `,
        [projectId]
      ),
      pool.query(
        `
          SELECT
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.due_date,
            t.created_at,
            t.updated_at,
            t.assignee_id,
            assignee.name AS assignee_name,
            assignee.email AS assignee_email,
            creator.name AS created_by_name
          FROM tasks t
          LEFT JOIN users assignee ON assignee.id = t.assignee_id
          JOIN users creator ON creator.id = t.created_by
          WHERE t.project_id = $1
          ORDER BY
            CASE t.status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END,
            t.due_date ASC NULLS LAST,
            t.created_at DESC
        `,
        [projectId]
      )
    ]);

    const project = projectResult.rows[0];
    if (!project) throw notFound("Project not found");

    res.json({
      project,
      members: membersResult.rows,
      tasks: tasksResult.rows
    });
  })
);

projectRouter.post(
  "/:projectId/members",
  validateBody(addMemberSchema),
  asyncHandler(async (req, res) => {
    const currentUser = (req as AuthedRequest).user;
    const projectId = String(req.params.projectId);
    await ensureProjectManager(projectId, currentUser.id);

    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [req.body.email]);
    const user = userResult.rows[0];

    if (!user) {
      throw new ApiError(404, "No user found with that email");
    }

    await pool.query(
      `
        INSERT INTO project_members (project_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (project_id, user_id)
        DO UPDATE SET role = EXCLUDED.role
      `,
      [projectId, user.id, req.body.role]
    );

    res.status(201).json({ message: "Member saved" });
  })
);

projectRouter.delete(
  "/:projectId/members/:userId",
  asyncHandler(async (req, res) => {
    const currentUser = (req as AuthedRequest).user;
    const projectId = String(req.params.projectId);
    const userId = String(req.params.userId);
    const membership = await ensureProjectManager(projectId, currentUser.id);

    if (userId === membership.owner_id) {
      throw new ApiError(400, "Project owner cannot be removed");
    }

    await pool.query(
      "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
      [projectId, userId]
    );

    res.status(204).send();
  })
);
