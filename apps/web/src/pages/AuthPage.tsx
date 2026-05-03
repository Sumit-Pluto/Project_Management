import { FormEvent, useState } from "react";
import { Check, LockKeyhole, UserPlus } from "lucide-react";
import { ApiClientError } from "../api/client";
import type { Role } from "../api/types";
import { useAuth } from "../context/useAuth";

export function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup({ name, email, password, role });
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authLayout">
      <section className="authPanel">
        <div className="authCopy">
          <span className="eyebrow">Full-stack assignment</span>
          <h1>Team Task Manager</h1>
          <p>
            Create projects, add teammates, assign tasks, and keep the work honest with
            role-based access.
          </p>
          <div className="promiseList">
            <span>
              <Check size={16} /> JWT authentication
            </span>
            <span>
              <Check size={16} /> PostgreSQL relationships
            </span>
            <span>
              <Check size={16} /> Admin and member workflows
            </span>
          </div>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          <div className="segmented">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              <LockKeyhole size={16} /> Login
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
            >
              <UserPlus size={16} /> Signup
            </button>
          </div>

          {mode === "signup" && (
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {mode === "signup" && (
            <label>
              Role
              <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            </label>
          )}

          {error && <p className="errorText">{error}</p>}

          <button className="primaryButton" disabled={loading}>
            {loading ? "Working..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
