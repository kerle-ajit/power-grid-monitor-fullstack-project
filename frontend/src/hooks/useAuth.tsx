import { createContext, useContext, useMemo, useState } from "react";
import { getStoredUser, login as loginApi, logout as logoutApi } from "../api/auth";

type AuthUser = {
  id: string;
  role: "OPERATOR" | "SUPERVISOR";
  zoneIds: string[];
  token: string;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user?.token),
      async login(username, password) {
        const next = await loginApi(username, password);
        setUser(next);
      },
      logout() {
        logoutApi();
        setUser(null);
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

