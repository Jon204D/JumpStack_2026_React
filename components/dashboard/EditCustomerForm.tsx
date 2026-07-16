"use client";

import axios from "axios";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api/client";
import type {
  AdminUpdateCustomerRequest,
  ApiError,
  Customer,
  LoginRequest,
  UpdateCustomerRequest,
} from "@/lib/api/types";
import styles from "./EditCustomerForm.module.scss";

type EditCustomerFormProps = LoginRequest & {
  customer: Customer;
  onCancel: () => void;
  onUpdated: (customer: Customer, message: string) => void;
};

type FieldErrors = Record<string, string>;

export function EditCustomerForm({
  customer,
  onCancel,
  onUpdated,
  password: adminPassword,
  username: adminUsername,
}: EditCustomerFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const validationErrors: FieldErrors = {};

    if (!username) validationErrors.username = "Username is required.";
    else if (username.length > 50) {
      validationErrors.username = "Username cannot exceed 50 characters.";
    }

    if (password && (password.length < 8 || password.length > 72)) {
      validationErrors.password =
        "Password must be between 8 and 72 characters.";
    }
    if (password !== confirmPassword) {
      validationErrors.confirmPassword = "Passwords must match.";
    }

    const usernameChanged = username !== customer.username;
    if (!usernameChanged && !password) {
      validationErrors.form = "Change the username or enter a new password.";
    }

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    const update: UpdateCustomerRequest = {};
    if (usernameChanged) update.username = username;
    if (password) update.password = password;

    const request: AdminUpdateCustomerRequest = {
      admin: { password: adminPassword, username: adminUsername },
      customerId: customer.id,
      update,
    };

    setIsSubmitting(true);
    try {
      const { data } = await apiClient.patch<Customer>(
        "/admin/customers",
        request,
      );
      const changes = [
        usernameChanged ? "username updated" : null,
        password ? "password reset" : null,
      ].filter(Boolean);
      onUpdated(data, `${data.username}: ${changes.join(" and ")}.`);
    } catch (requestError) {
      if (axios.isAxiosError<ApiError>(requestError)) {
        setError(
          requestError.response?.data.message ??
            "The customer access details could not be updated.",
        );
        setFieldErrors(requestError.response?.data.fieldErrors ?? {});
      } else {
        setError("The customer access details could not be updated.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="edit-customer-title"
      className={styles.panel}
      role="dialog"
    >
      <div className={styles.heading}>
        <div>
          <p>Customer access</p>
          <h3 id="edit-customer-title">Edit {customer.username}</h3>
          <span>
            Update the login name, reset the password, or do both together.
          </span>
        </div>
        <button
          aria-label="Close edit customer form"
          className={styles.close}
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>

      <form noValidate onSubmit={handleSubmit}>
        {error || fieldErrors.form ? (
          <div className={styles.error} role="alert">
            {error ?? fieldErrors.form}
          </div>
        ) : null}

        <div className={styles.fields}>
          <label>
            <span>Username</span>
            <input
              aria-describedby={
                fieldErrors.username ? "edit-username-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.username)}
              autoComplete="off"
              defaultValue={customer.username}
              name="username"
              type="text"
            />
            {fieldErrors.username ? (
              <small id="edit-username-error">{fieldErrors.username}</small>
            ) : (
              <small className={styles.help}>Used for the customer login.</small>
            )}
          </label>

          <label>
            <span>New password</span>
            <input
              aria-describedby={
                fieldErrors.password ? "edit-password-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.password)}
              autoComplete="new-password"
              name="password"
              placeholder="Leave blank to keep current password"
              type="password"
            />
            {fieldErrors.password ? (
              <small id="edit-password-error">{fieldErrors.password}</small>
            ) : (
              <small className={styles.help}>8–72 characters when changed.</small>
            )}
          </label>

          <label>
            <span>Confirm new password</span>
            <input
              aria-describedby={
                fieldErrors.confirmPassword
                  ? "edit-confirm-password-error"
                  : undefined
              }
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              autoComplete="new-password"
              name="confirmPassword"
              type="password"
            />
            {fieldErrors.confirmPassword ? (
              <small id="edit-confirm-password-error">
                {fieldErrors.confirmPassword}
              </small>
            ) : (
              <small className={styles.help}>Re-enter only a new password.</small>
            )}
          </label>
        </div>

        <div className={styles.notice}>
          <strong>Security note</strong>
          <span>
            Passwords are replaced with a one-way hash. The current password
            cannot be viewed or recovered.
          </span>
        </div>

        <div className={styles.actions}>
          <Button
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving…" : "Save access changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}
