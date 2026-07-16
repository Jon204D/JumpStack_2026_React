"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import type { Role } from "@/lib/api/types";
import styles from "./DashboardShell.module.scss";

type DashboardShellProps = {
  children: ReactNode;
  role: Role;
  username: string;
};

const adminNavigation = [
  { href: "#overview", label: "Overview" },
  { href: "#customers", label: "Customers" },
  { href: "#accounts", label: "Accounts" },
  { href: "#activity", label: "Activity" },
];
const customerNavigation = [
  { href: "#overview", label: "Overview" },
  { href: "#accounts", label: "My accounts" },
  { href: "#activity", label: "Activity" },
];

export function DashboardShell({
  children,
  role,
  username,
}: DashboardShellProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/" aria-label="Ledger Atlas home">
          <span aria-hidden="true">LA</span>
          <strong>Ledger Atlas</strong>
        </Link>

        <nav aria-label="Dashboard navigation">
          <p>{role === "ADMIN" ? "Administration" : "Personal banking"}</p>
          <ul>
            {(role === "ADMIN" ? adminNavigation : customerNavigation).map(
              (item, index) => (
                <li key={item.href}>
                  <a
                    className={index === 0 ? styles.active : undefined}
                    href={item.href}
                  >
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className={styles.sidebarNote}>
          <span aria-hidden="true">✓</span>
          <p>
            <strong>Secure session</strong>
            Your credentials remain in this tab only.
          </p>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <p>Signed in as</p>
            <strong>{username}</strong>
            <span>{role}</span>
          </div>
          <Button onClick={handleSignOut} variant="secondary">
            Sign out
          </Button>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
