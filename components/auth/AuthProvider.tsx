"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Role } from "@/lib/api/types";

type AuthSession = {
  password: string;
  role: Role;
  username: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const value = useMemo(
    () => ({ session, signIn: setSession, signOut: () => setSession(null) }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
