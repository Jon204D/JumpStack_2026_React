"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import styles from "./page.module.scss";

export default function DashboardPage() {
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (!session) router.replace("/login");
  }, [router, session]);

  if (!session) {
    return <main className={styles.redirecting}>Returning to secure sign in…</main>;
  }

  return (
    <DashboardShell role={session.role} username={session.username}>
      {session.role === "ADMIN" ? (
        <AdminDashboard
          password={session.password}
          username={session.username}
        />
      ) : (
        <section className={styles.customerWelcome}>
          <p>Personal banking</p>
          <h1>Welcome, {session.username}.</h1>
          <span>Your account overview is the next dashboard target.</span>
        </section>
      )}
    </DashboardShell>
  );
}
