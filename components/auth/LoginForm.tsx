"use client";

import { type FormEvent, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { ApiError, LoginResponse } from "@/lib/api/types";
import { useAuth } from "./AuthProvider";
import styles from "./LoginForm.module.scss";

export function LoginForm() {
  const { session, signIn, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        body: JSON.stringify({ password, username }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const apiError = (await response.json()) as ApiError;
        setError(apiError.message || "Sign in failed. Please try again.");
        return;
      }

      const result = (await response.json()) as LoginResponse;
      signIn({ password, role: result.role, username: result.username });
      event.currentTarget.reset();
    } catch {
      setError("The sign-in service is unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (session) {
    return (
      <div className={styles.success} role="status">
        <span className={styles.successMark} aria-hidden="true">✓</span>
        <p className={styles.kicker}>Identity verified</p>
        <h2>Welcome, {session.username}.</h2>
        <p>
          You are signed in with the <strong>{session.role.toLowerCase()}</strong>{" "}
          role. Your credentials are held only in memory and will be cleared when
          this browser tab reloads.
        </p>
        <div className={styles.actions}>
          <ButtonLink href="/" variant="secondary">Return home</ButtonLink>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error ? <div className={styles.error} role="alert">{error}</div> : null}

      <label className={styles.field}>
        <span>Username</span>
        <input
          autoComplete="username"
          name="username"
          placeholder="Enter your username"
          required
          type="text"
        />
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <input
          autoComplete="current-password"
          name="password"
          placeholder="Enter your password"
          required
          type="password"
        />
      </label>

      <Button className={styles.submit} disabled={isSubmitting} type="submit">
        {isSubmitting ? "Verifying…" : "Sign in securely"}
      </Button>
      <p className={styles.privacy}>Credentials are sent securely for verification and are never written to local storage.</p>
    </form>
  );
}
