"use client";

import axios from "axios";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiClient, bearerHeaders } from "@/lib/api/client";
import type {
  AdminResponse,
  ApiError,
  CreateAdminRequest,
} from "@/lib/api/types";
import styles from "./CreateAdminForm.module.scss";

type CreateAdminFormProps = {
  accessToken: string;
};

type FieldErrors = Record<string, string>;

export function CreateAdminForm({ accessToken }: CreateAdminFormProps) {
  const [createdAdmin, setCreatedAdmin] = useState<AdminResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const validationErrors: FieldErrors = {};

    if (!username) {
      validationErrors.username = "Username is required.";
    } else if (username.length > 50) {
      validationErrors.username = "Username cannot exceed 50 characters.";
    }

    if (!password) {
      validationErrors.password = "Password is required.";
    } else if (password.length < 8 || password.length > 72) {
      validationErrors.password = "Password must be between 8 and 72 characters.";
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = "Confirm the password.";
    } else if (password !== confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const request: CreateAdminRequest = { password, username };

    try {
      const { data } = await apiClient.post<AdminResponse>(
        "/admin/admins",
        request,
        { headers: bearerHeaders(accessToken) },
      );
      form.reset();
      setCreatedAdmin(data);
    } catch (requestError) {
      if (axios.isAxiosError<ApiError>(requestError)) {
        setError(
          requestError.response?.data.message ??
            "The administrator could not be created.",
        );
        setFieldErrors(requestError.response?.data.fieldErrors ?? {});
      } else {
        setError("The administrator could not be created.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setCreatedAdmin(null);
    setError(null);
    setFieldErrors({});
    setShowPasswords(false);
  }

  return (
    <section
      aria-labelledby="administrator-access-title"
      className={styles.section}
      id="administrators"
    >
      <div className={styles.introduction}>
        <div>
          <p>Privileged access</p>
          <h2 id="administrator-access-title">Administrator access</h2>
          <span>
            Create a trusted operator who can onboard customers, open accounts,
            and manage bank records.
          </span>
        </div>
        <div className={styles.roleBadge}>
          <span aria-hidden="true">A</span>
          <div>
            <strong>Role assigned automatically</strong>
            <small>ADMIN · full operational access</small>
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.guidance}>
          <span className={styles.lock} aria-hidden="true">⌁</span>
          <p>Before granting access</p>
          <h3>Keep the administrator circle small.</h3>
          <ul>
            <li>Verify the operator’s identity outside this application.</li>
            <li>Issue an individual username instead of sharing credentials.</li>
            <li>Send the initial password through a secure channel.</li>
          </ul>
          <small>
            Customers cannot use this workflow. The server independently
            requires an ADMIN bearer token.
          </small>
        </aside>

        <div className={styles.formCard}>
          {createdAdmin ? (
            <div className={styles.receipt} role="status">
              <span className={styles.successIcon} aria-hidden="true">✓</span>
              <p>Administrator created</p>
              <h3>{createdAdmin.username}</h3>
              <dl>
                <div>
                  <dt>Role</dt>
                  <dd>{createdAdmin.role}</dd>
                </div>
                <div>
                  <dt>Record ID</dt>
                  <dd>{createdAdmin.id}</dd>
                </div>
              </dl>
              <Button onClick={resetForm} variant="secondary">
                Create another administrator
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.formHeading}>
                <div>
                  <p>New administrator</p>
                  <h3>Set secure sign-in credentials</h3>
                </div>
                <span>All fields required</span>
              </div>

              {error ? (
                <div className={styles.error} role="alert">{error}</div>
              ) : null}

              <div className={styles.fields}>
                <label>
                  <span>Username</span>
                  <input
                    aria-label="Username"
                    aria-describedby={
                      fieldErrors.username ? "admin-username-error" : undefined
                    }
                    aria-invalid={Boolean(fieldErrors.username)}
                    autoComplete="off"
                    autoFocus
                    maxLength={50}
                    name="username"
                    placeholder="e.g. branch.admin"
                    type="text"
                  />
                  {fieldErrors.username ? (
                    <small id="admin-username-error">{fieldErrors.username}</small>
                  ) : null}
                </label>

                <label>
                  <span>Password</span>
                  <input
                    aria-label="Password"
                    aria-describedby={
                      fieldErrors.password
                        ? "admin-password-error"
                        : "admin-password-help"
                    }
                    aria-invalid={Boolean(fieldErrors.password)}
                    autoComplete="new-password"
                    maxLength={72}
                    minLength={8}
                    name="password"
                    type={showPasswords ? "text" : "password"}
                  />
                  {fieldErrors.password ? (
                    <small id="admin-password-error">{fieldErrors.password}</small>
                  ) : (
                    <small className={styles.help} id="admin-password-help">
                      Use 8–72 characters.
                    </small>
                  )}
                </label>

                <label>
                  <span>Confirm password</span>
                  <input
                    aria-label="Confirm password"
                    aria-describedby={
                      fieldErrors.confirmPassword
                        ? "admin-confirm-password-error"
                        : undefined
                    }
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    autoComplete="new-password"
                    maxLength={72}
                    minLength={8}
                    name="confirmPassword"
                    type={showPasswords ? "text" : "password"}
                  />
                  {fieldErrors.confirmPassword ? (
                    <small id="admin-confirm-password-error">
                      {fieldErrors.confirmPassword}
                    </small>
                  ) : null}
                </label>
              </div>

              <label className={styles.showPassword}>
                <input
                  aria-label="Show passwords"
                  checked={showPasswords}
                  onChange={(event) => setShowPasswords(event.target.checked)}
                  type="checkbox"
                />
                <span>Show passwords</span>
              </label>

              <div className={styles.actions}>
                <p>
                  The password is encrypted before it is stored and is never
                  returned by the API.
                </p>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Creating administrator…" : "Create administrator"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
