"use client";

import axios from "axios";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiClient, bearerHeaders } from "@/lib/api/client";
import type {
  Account,
  AccountType,
  AdminCreateAccountRequest,
  ApiError,
  Customer,
} from "@/lib/api/types";
import styles from "./AddAccountForm.module.scss";

type AddAccountFormProps = {
  accessToken: string;
  customer: Customer;
  onCancel: () => void;
  onCreated: (account: Account) => void;
};

type FieldErrors = Record<string, string>;

const balancePattern = /^\d{1,15}(\.\d{1,2})?$/;

export function AddAccountForm({
  accessToken,
  customer,
  onCancel,
  onCreated,
}: AddAccountFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    const type = String(formData.get("type") ?? "") as AccountType;
    const balanceInput = String(formData.get("startingBalance") ?? "").trim();
    const validationErrors: FieldErrors = {};

    if (type !== "CHECKING" && type !== "SAVINGS") {
      validationErrors.type = "Select an account type.";
    }

    if (!balanceInput) {
      validationErrors.startingBalance = "Starting balance is required.";
    } else if (!balancePattern.test(balanceInput)) {
      validationErrors.startingBalance =
        "Use a positive amount with no more than two decimal places.";
    }

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const request: AdminCreateAccountRequest = {
      account: {
        startingBalance: Number(balanceInput),
        type,
      },
      customerId: customer.id,
    };

    try {
      const { data } = await apiClient.post<Account>(
        "/admin/accounts",
        request,
        { headers: bearerHeaders(accessToken) },
      );
      form.reset();
      onCreated(data);
    } catch (requestError) {
      if (axios.isAxiosError<ApiError>(requestError)) {
        setError(
          requestError.response?.data.message ??
            "The account could not be opened.",
        );
        setFieldErrors(requestError.response?.data.fieldErrors ?? {});
      } else {
        setError("The account could not be opened.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className={styles.panel}
      aria-labelledby="add-account-title"
      role="dialog"
    >
      <div className={styles.heading}>
        <div>
          <p>New customer account</p>
          <h2 id="add-account-title">Open an account for {customer.username}</h2>
          <span>
            Choose the account type and opening balance. The account number is
            generated securely for you.
          </span>
        </div>
        <button
          aria-label="Close add account form"
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
            <span>Account type</span>
            <select
              aria-describedby={fieldErrors.type ? "type-error" : undefined}
              aria-invalid={Boolean(fieldErrors.type)}
              autoFocus
              defaultValue="CHECKING"
              name="type"
            >
              <option value="CHECKING">Checking</option>
              <option value="SAVINGS">Savings</option>
            </select>
            {fieldErrors.type ? (
              <small id="type-error">{fieldErrors.type}</small>
            ) : null}
          </label>

          <label>
            <span>Starting balance</span>
            <div className={styles.moneyInput}>
              <span aria-hidden="true">$</span>
              <input
                aria-describedby={
                  fieldErrors.startingBalance
                    ? "starting-balance-error"
                    : "starting-balance-help"
                }
                aria-invalid={Boolean(fieldErrors.startingBalance)}
                inputMode="decimal"
                min="0"
                name="startingBalance"
                placeholder="0.00"
                step="0.01"
                type="number"
              />
            </div>
            {fieldErrors.startingBalance ? (
              <small id="starting-balance-error">
                {fieldErrors.startingBalance}
              </small>
            ) : (
              <small className={styles.help} id="starting-balance-help">
                Zero is allowed when opening an account.
              </small>
            )}
          </label>
        </div>

        <div className={styles.actions}>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Opening account…" : "Open account"}
          </Button>
        </div>
      </form>
    </section>
  );
}
