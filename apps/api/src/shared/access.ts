import { pool } from "../db/pool.js";
import { forbidden, notFound } from "./errors.js";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
};

export async function getProjectMembership(projectId: string, userId: string) {
  const result = await pool.query<{
    role: "admin" | "member";
    owner_id: string;
  }>(
    `
      SELECT pm.role, p.owner_id
      FROM projects p
      JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = $1 AND pm.user_id = $2
    `,
    [projectId, userId]
  );

  return result.rows[0] ?? null;
}

export async function ensureProjectMember(projectId: string, userId: string) {
  const membership = await getProjectMembership(projectId, userId);
  if (!membership) throw notFound("Project not found");
  return membership;
}

export async function ensureProjectManager(projectId: string, userId: string) {
  const membership = await ensureProjectMember(projectId, userId);

  if (membership.role !== "admin" && membership.owner_id !== userId) {
    throw forbidden("Only project admins can make this change");
  }

  return membership;
}
