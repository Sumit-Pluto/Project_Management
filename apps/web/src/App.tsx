import { LogOut, PanelsTopLeft } from "lucide-react";
import { useAuth } from "./context/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { WorkspacePage } from "./pages/WorkspacePage";

export function App() {
  const { user, logout } = useAuth();

  if (!user) return <AuthPage />;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">
            <PanelsTopLeft size={18} />
          </span>
          <div>
            <strong>Team Task Manager</strong>
            <span>{user.role === "admin" ? "Admin workspace" : "Member workspace"}</span>
          </div>
        </div>

        <div className="userPill">
          <span>{user.name}</span>
          <button className="iconButton" onClick={logout} title="Log out" aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <WorkspacePage />
    </main>
  );
}
