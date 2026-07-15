"use client";

import axios from "axios";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api/client";
import type {
  AdminCreateCustomerRequest,
  ApiError,
  Customer,
} from "@/lib/api/types";
import styles from "./AddCustomerForm.module.scss";

type AddCustomerFormProps = {
  adminPassword: string;
  adminUsername: string;
  onCancel: () => void;
  onCreated: (customer: Customer) => void;
};

type FieldErrors = Record<string, string>;

export function AddCustomerForm({
  adminPassword,
  adminUsername,
  onCancel,
  onCreated,
}: AddCustomerFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!username) validationErrors.username = "Username is required.";
    else if (username.length > 50) {
      validationErrors.username = "Username cannot exceed 50 characters.";
    }

    if (!password) validationErrors.password = "Password is required.";
    else if (password.length < 8 || password.length > 72) {
      validationErrors.password =
        "Password must be between 8 and 72 characters.";
    }

    if (confirmPassword !== password) {
      validationErrors.confirmPassword = "Passwords must match.";
    }

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const request: AdminCreateCustomerRequest = {
      admin: { password: adminPassword, username: adminUsername },
      customer: { password, username },
    };

    try {
      const { data } = await apiClient.post<Customer>(
        "/admin/customers",
        request,
      );
      form.reset();
      onCreated(data);
    } catch (requestError) {
      if (axios.isAxiosError<ApiError>(requestError)) {
        setError(
          requestError.response?.data.message ??
            "The customer could not be created.",
        );
        setFieldErrors(requestError.response?.data.fieldErrors ?? {});
      } else {
        setError("The customer could not be created.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className={styles.panel}
      aria-labelledby="add-customer-title"
      role="dialog"
    >
      <div className={styles.heading}>
        <div>
          <p>New customer</p>
          <h2 id="add-customer-title">Create secure banking access</h2>
          <span>
            The password is hashed by Spring Boot before it reaches MongoDB.
          </span>
        </div>
        <button
          aria-label="Close add customer form"
          className={styles.close}
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className={styles.error} role="alert">
            {error}
          </div>
        ) : null}

        <div className={styles.fields}>
          <label>
            <span>Username</span>
            <input
              aria-describedby={
                fieldErrors.username ? "username-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.username)}
              autoComplete="off"
              autoFocus
              name="username"
              placeholder="e.g. customer2"
              type="text"
            />
            {fieldErrors.username ? (
              <small id="username-error">{fieldErrors.username}</small>
            ) : null}
          </label>

          <label>
            <span>Temporary password</span>
            <input
              aria-describedby={
                fieldErrors.password ? "password-error" : "password-help"
              }
              aria-invalid={Boolean(fieldErrors.password)}
              autoComplete="new-password"
              name="password"
              placeholder="At least 8 characters"
              type="password"
            />
            {fieldErrors.password ? (
              <small id="password-error">{fieldErrors.password}</small>
            ) : (
              <small className={styles.help} id="password-help">
                Use 8–72 characters.
              </small>
            )}
          </label>

          <label>
            <span>Confirm password</span>
            <input
              aria-describedby={
                fieldErrors.confirmPassword
                  ? "confirm-password-error"
                  : undefined
              }
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              autoComplete="new-password"
              name="confirmPassword"
              placeholder="Enter it again"
              type="password"
            />
            {fieldErrors.confirmPassword ? (
              <small id="confirm-password-error">
                {fieldErrors.confirmPassword}
              </small>
            ) : null}
          </label>
        </div>

        <div className={styles.actions}>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating customer…" : "Create customer"}
          </Button>
        </div>
      </form>
    </section>
  );
}
