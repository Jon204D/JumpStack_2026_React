"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { CustomerDashboard } from "@/components/dashboard/CustomerDashboard";
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
          accessToken={session.accessToken}
          username={session.username}
        />
      ) : (
        session.customerId ? (
          <CustomerDashboard
            customerId={session.customerId}
            accessToken={session.accessToken}
            username={session.username}
          />
        ) : (
          <section className={styles.sessionError} role="alert">
            This customer login is not linked to a customer profile. Please
            contact an administrator.
          </section>
        )
      )}
    </DashboardShell>
  );
}
