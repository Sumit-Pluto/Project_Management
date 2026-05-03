export type Role = "admin" | "member";
export type TaskStatus = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  my_role: Role;
  task_count?: number;
  done_count?: number;
};

export type ProjectMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  joined_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  assignee_id: string | null;
  assignee_name?: string | null;
  assignee_email?: string | null;
  created_by_name?: string;
  project_name?: string;
};

export type DashboardSummary = {
  projects: number;
  total_tasks: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
};
