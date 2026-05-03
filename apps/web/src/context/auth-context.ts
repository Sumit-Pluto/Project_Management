import { createContext } from "react";
import type { Role, User } from "../api/types";

export type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: { name: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
