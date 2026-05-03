import { FormEvent, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  Users
} from "lucide-react";
import { api, ApiClientError } from "../api/client";
import type {
  DashboardSummary,
  Priority,
  Project,
  ProjectMember,
  Role,
  Task,
  TaskStatus
} from "../api/types";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/useAuth";

type ProjectPayload = {
  project: Project;
  members: ProjectMember[];
  tasks: Task[];
};

const defaultSummary: DashboardSummary = {
  projects: 0,
  total_tasks: 0,
  todo: 0,
  in_progress: 0,
  done: 0,
  overdue: 0
};

export function WorkspacePage() {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectPayload, setProjectPayload] = useState<ProjectPayload | null>(null);
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const loadWorkspace = useCallback(async (nextProjectId: string | null = null) => {
    if (!token) return;
    setLoading(true);
    setNotice("");

    try {
      const [projectList, dashboard] = await Promise.all([
        api<{ projects: Project[] }>("/api/projects", { token }),
        api<{
          summary: DashboardSummary;
          recentTasks: Task[];
          overdueTasks: Task[];
        }>("/api/dashboard", { token })
      ]);

      setProjects(projectList.projects);
      setSummary(dashboard.summary ?? defaultSummary);
      setRecentTasks(dashboard.recentTasks);
      setOverdueTasks(dashboard.overdueTasks);

      const fallbackId = projectList.projects[0]?.id ?? null;
      const projectId = nextProjectId ?? fallbackId;
      setSelectedProjectId(projectId);

      if (projectId) {
        const detail = await api<ProjectPayload>(`/api/projects/${projectId}`, { token });
        setProjectPayload(detail);
      } else {
        setProjectPayload(null);
      }
    } catch (err) {
      setNotice(err instanceof ApiClientError ? err.message : "Could not load workspace");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadWorkspace(null);
  }, [loadWorkspace]);

  const canManageSelected = useMemo(() => {
    if (!user || !projectPayload) return false;
    return projectPayload.project.my_role === "admin" || projectPayload.project.owner_id === user.id;
  }, [projectPayload, user]);

  return (
    <section className="workspace">
      <aside className="sidebar">
        <div className="sideTitle">
          <LayoutDashboard size={18} />
          <span>Projects</span>
        </div>

        {user?.role === "admin" && <CreateProjectForm token={token} onDone={loadWorkspace} />}

        <div className="projectList">
          {projects.map((project) => {
            const done = project.done_count ?? 0;
            const total = project.task_count ?? 0;
            const progress = total ? Math.round((done / total) * 100) : 0;

            return (
              <button
                key={project.id}
                className={project.id === selectedProjectId ? "projectRow active" : "projectRow"}
                onClick={() => loadWorkspace(project.id)}
              >
                <span>{project.name}</span>
                <small>{progress}% complete</small>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="content">
        <section className="dashboardGrid">
          <StatCard label="Projects" value={summary.projects} icon={<FolderKanban size={18} />} />
          <StatCard label="Tasks" value={summary.total_tasks} icon={<ListTodo size={18} />} />
          <StatCard label="Done" value={summary.done} icon={<CheckCircle2 size={18} />} />
          <StatCard label="Overdue" value={summary.overdue} icon={<AlertTriangle size={18} />} />
        </section>

        {notice && <p className="notice">{notice}</p>}
        {loading && <p className="muted">Loading workspace...</p>}

        {projectPayload ? (
          <ProjectBoard
            payload={projectPayload}
            token={token}
            canManage={canManageSelected}
            onDone={() => loadWorkspace(projectPayload.project.id)}
          />
        ) : (
          !loading && <EmptyWorkspace isAdmin={user?.role === "admin"} />
        )}

        <section className="activityGrid">
          <TaskList title="Recently updated" icon={<RefreshCw size={17} />} tasks={recentTasks} />
          <TaskList title="Needs attention" icon={<CalendarClock size={17} />} tasks={overdueTasks} />
        </section>
      </div>
    </section>
  );
}

function CreateProjectForm({
  token,
  onDone
}: {
  token: string | null;
  onDone: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    try {
      await api("/api/projects", {
        method: "POST",
        token,
        body: JSON.stringify({ name, description })
      });
      setName("");
      setDescription("");
      setOpen(false);
      await onDone();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create project");
    }
  }

  if (!open) {
    return (
      <button className="outlineButton fullWidth" onClick={() => setOpen(true)}>
        <Plus size={16} /> New project
      </button>
    );
  }

  return (
    <form className="stackForm" onSubmit={submit}>
      <label>
        Project name
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      {error && <p className="errorText">{error}</p>}
      <button className="primaryButton">Create project</button>
    </form>
  );
}

function ProjectBoard({
  payload,
  token,
  canManage,
  onDone
}: {
  payload: ProjectPayload;
  token: string | null;
  canManage: boolean;
  onDone: () => Promise<void>;
}) {
  return (
    <section className="projectBoard">
      <div className="sectionHeader">
        <div>
          <h2>{payload.project.name}</h2>
          <p>{payload.project.description || "No description yet."}</p>
        </div>
        <span className="rolePill">{payload.project.my_role}</span>
      </div>

      <div className="boardColumns">
        <div className="panel">
          <div className="panelHeader">
            <Users size={17} />
            <h3>Team</h3>
          </div>
          <div className="memberList">
            {payload.members.map((member) => (
              <div className="memberRow" key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.email}</span>
                </div>
                <small>{member.role}</small>
              </div>
            ))}
          </div>
          {canManage && <InviteMemberForm projectId={payload.project.id} token={token} onDone={onDone} />}
        </div>

        <div className="panel taskPanel">
          <div className="panelHeader">
            <ListTodo size={17} />
            <h3>Tasks</h3>
          </div>

          {canManage && (
            <TaskForm
              projectId={payload.project.id}
              members={payload.members}
              token={token}
              onDone={onDone}
            />
          )}

          <div className="taskList">
            {payload.tasks.map((task) => (
              <TaskCard key={task.id} task={task} token={token} canManage={canManage} onDone={onDone} />
            ))}
            {!payload.tasks.length && <p className="muted">No tasks yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function InviteMemberForm({
  projectId,
  token,
  onDone
}: {
  projectId: string;
  token: string | null;
  onDone: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    await api(`/api/projects/${projectId}/members`, {
      method: "POST",
      token,
      body: JSON.stringify({ email, role })
    });
    setEmail("");
    await onDone();
  }

  return (
    <form className="inlineForm" onSubmit={submit}>
      <div className="fieldWithIcon">
        <Search size={15} />
        <input
          type="email"
          placeholder="teammate@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button className="iconButton" title="Add member" aria-label="Add member">
        <Plus size={17} />
      </button>
    </form>
  );
}

function TaskForm({
  projectId,
  members,
  token,
  onDone
}: {
  projectId: string;
  members: ProjectMember[];
  token: string | null;
  onDone: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    await api(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      token,
      body: JSON.stringify({ title, assigneeId, priority, dueDate })
    });
    setTitle("");
    setAssigneeId("");
    setDueDate("");
    await onDone();
  }

  return (
    <form className="taskForm" onSubmit={submit}>
      <input
        placeholder="Task title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
        <option value="">Unassigned</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      <button className="primaryButton">Add task</button>
    </form>
  );
}

function TaskCard({
  task,
  token,
  canManage,
  onDone
}: {
  task: Task;
  token: string | null;
  canManage: boolean;
  onDone: () => Promise<void>;
}) {
  async function updateStatus(status: TaskStatus) {
    if (!token) return;
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status })
    });
    await onDone();
  }

  async function removeTask() {
    if (!token) return;
    await api(`/api/tasks/${task.id}`, { method: "DELETE", token });
    await onDone();
  }

  return (
    <article className="taskCard">
      <div className="taskTitleRow">
        <strong>{task.title}</strong>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.description && <p>{task.description}</p>}
      <div className="taskMeta">
        <StatusBadge status={task.status} />
        <span>{task.assignee_name ?? "Unassigned"}</span>
        {task.due_date && <span>Due {new Date(task.due_date).toLocaleDateString()}</span>}
      </div>
      <div className="statusControls">
        {(["todo", "in_progress", "done"] as TaskStatus[]).map((status) => (
          <button
            key={status}
            className={task.status === status ? "active" : ""}
            onClick={() => updateStatus(status)}
          >
            {status === "todo" ? "To do" : status === "in_progress" ? "Doing" : "Done"}
          </button>
        ))}
        {canManage && (
          <button className="dangerText" onClick={removeTask}>
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

function TaskList({ title, icon, tasks }: { title: string; icon: ReactNode; tasks: Task[] }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        {icon}
        <h3>{title}</h3>
      </div>
      <div className="compactList">
        {tasks.map((task) => (
          <div className="compactTask" key={task.id}>
            <strong>{task.title}</strong>
            <span>{task.project_name}</span>
          </div>
        ))}
        {!tasks.length && <p className="muted">Nothing here right now.</p>}
      </div>
    </section>
  );
}

function EmptyWorkspace({ isAdmin }: { isAdmin?: boolean }) {
  return (
    <section className="emptyState">
      <FolderKanban size={34} />
      <h2>{isAdmin ? "Create your first project" : "No projects assigned yet"}</h2>
      <p>
        {isAdmin
          ? "Use the project button in the sidebar to start the workspace."
          : "Ask an admin to add your email to a project team."}
      </p>
    </section>
  );
}
