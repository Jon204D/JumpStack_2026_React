"use client";

import axios from "axios";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api/client";
import type {
  AccountType,
  AdminCreateCustomerRequest,
  ApiError,
  CustomerOnboardingResponse,
  InitialAccountRequest,
} from "@/lib/api/types";
import styles from "./AddCustomerForm.module.scss";

type AddCustomerFormProps = {
  adminPassword: string;
  adminUsername: string;
  onCancel: () => void;
  onCreated: (result: CustomerOnboardingResponse) => void;
};

type AccountSelection = AccountType | "BOTH";
type FieldErrors = Record<string, string>;

const balancePattern = /^\d{1,15}(\.\d{1,2})?$/;
const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

function toCents(value: string) {
  const cleanValue = value.trim();
  if (!balancePattern.test(cleanValue)) return null;
  const [whole, fraction = ""] = cleanValue.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function AddCustomerForm({
  adminPassword,
  adminUsername,
  onCancel,
  onCreated,
}: AddCustomerFormProps) {
  const [accountSelection, setAccountSelection] =
    useState<AccountSelection>("BOTH");
  const [checkingBalance, setCheckingBalance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingsBalance, setSavingsBalance] = useState("");
  const [totalBalance, setTotalBalance] = useState("");

  const allocation = useMemo(() => {
    const total = toCents(totalBalance);
    const checking = toCents(checkingBalance);
    const savings = toCents(savingsBalance);

    if (accountSelection !== "BOTH" || total === null) return null;

    const allocated = (checking ?? 0) + (savings ?? 0);
    return { allocated, difference: total - allocated, total };
  }, [accountSelection, checkingBalance, savingsBalance, totalBalance]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const totalCents = toCents(totalBalance);
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

    if (totalCents === null) {
      validationErrors.totalStartingBalance =
        "Enter a non-negative total with no more than two decimal places.";
    }

    let accounts: InitialAccountRequest[] = [];

    if (totalCents !== null && accountSelection === "BOTH") {
      const checkingCents = toCents(checkingBalance);
      const savingsCents = toCents(savingsBalance);

      if (checkingCents === null) {
        validationErrors.checkingBalance = "Enter a valid checking amount.";
      }
      if (savingsCents === null) {
        validationErrors.savingsBalance = "Enter a valid savings amount.";
      }
      if (
        checkingCents !== null &&
        savingsCents !== null &&
        checkingCents + savingsCents !== totalCents
      ) {
        validationErrors.allocation =
          checkingCents + savingsCents > totalCents
            ? "The account allocations exceed the total starting balance."
            : "Allocate the entire starting balance before continuing.";
      }

      accounts = [
        { startingBalance: (checkingCents ?? 0) / 100, type: "CHECKING" },
        { startingBalance: (savingsCents ?? 0) / 100, type: "SAVINGS" },
      ];
    } else if (totalCents !== null) {
      accounts = [
        {
          startingBalance: totalCents / 100,
          type: accountSelection === "CHECKING" ? "CHECKING" : "SAVINGS",
        },
      ];
    }

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const request: AdminCreateCustomerRequest = {
      admin: { password: adminPassword, username: adminUsername },
      onboarding: {
        accounts,
        password,
        totalStartingBalance: totalCents! / 100,
        username,
      },
    };

    try {
      const { data } = await apiClient.post<CustomerOnboardingResponse>(
        "/admin/customers",
        request,
      );
      form.reset();
      onCreated(data);
    } catch (requestError) {
      if (axios.isAxiosError<ApiError>(requestError)) {
        setError(
          requestError.response?.data.message ??
            "The customer could not be onboarded.",
        );
        setFieldErrors(requestError.response?.data.fieldErrors ?? {});
      } else {
        setError("The customer could not be onboarded.");
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
          <h2 id="add-customer-title">Onboard customer and accounts</h2>
          <span>
            Create secure access and open the customer&apos;s first account in
            one step.
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

        <fieldset className={styles.section}>
          <legend>Customer access</legend>
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
        </fieldset>

        <fieldset className={styles.section}>
          <legend>Opening accounts</legend>
          <div className={styles.accountChoices}>
            {(["BOTH", "CHECKING", "SAVINGS"] as const).map((selection) => (
              <label key={selection}>
                <input
                  checked={accountSelection === selection}
                  name="accountSelection"
                  onChange={() => setAccountSelection(selection)}
                  type="radio"
                  value={selection}
                />
                <span>
                  <strong>
                    {selection === "BOTH"
                      ? "Checking + savings"
                      : selection === "CHECKING"
                        ? "Checking"
                        : "Savings"}
                  </strong>
                  <small>
                    {selection === "BOTH"
                      ? "Recommended"
                      : "One opening account"}
                  </small>
                </span>
              </label>
            ))}
          </div>

          <div className={styles.balanceFields}>
            <label>
              <span>Total starting balance</span>
              <div className={styles.moneyInput}>
                <span aria-hidden="true">$</span>
                <input
                  aria-describedby={
                    fieldErrors.totalStartingBalance
                      ? "total-balance-error"
                      : "total-balance-help"
                  }
                  aria-invalid={Boolean(fieldErrors.totalStartingBalance)}
                  inputMode="decimal"
                  min="0"
                  name="totalStartingBalance"
                  onChange={(event) => setTotalBalance(event.target.value)}
                  placeholder="100.00"
                  step="0.01"
                  type="number"
                  value={totalBalance}
                />
              </div>
              {fieldErrors.totalStartingBalance ? (
                <small id="total-balance-error">
                  {fieldErrors.totalStartingBalance}
                </small>
              ) : (
                <small className={styles.help} id="total-balance-help">
                  This is distributed across the selected account(s).
                </small>
              )}
            </label>

            {accountSelection === "BOTH" ? (
              <>
                <label>
                  <span>Checking allocation</span>
                  <div className={styles.moneyInput}>
                    <span aria-hidden="true">$</span>
                    <input
                      aria-describedby={
                        fieldErrors.checkingBalance
                          ? "checking-balance-error"
                          : undefined
                      }
                      aria-invalid={Boolean(fieldErrors.checkingBalance)}
                      inputMode="decimal"
                      min="0"
                      name="checkingBalance"
                      onChange={(event) =>
                        setCheckingBalance(event.target.value)
                      }
                      placeholder="25.00"
                      step="0.01"
                      type="number"
                      value={checkingBalance}
                    />
                  </div>
                  {fieldErrors.checkingBalance ? (
                    <small id="checking-balance-error">
                      {fieldErrors.checkingBalance}
                    </small>
                  ) : null}
                </label>

                <label>
                  <span>Savings allocation</span>
                  <div className={styles.moneyInput}>
                    <span aria-hidden="true">$</span>
                    <input
                      aria-describedby={
                        fieldErrors.savingsBalance
                          ? "savings-balance-error"
                          : undefined
                      }
                      aria-invalid={Boolean(fieldErrors.savingsBalance)}
                      inputMode="decimal"
                      min="0"
                      name="savingsBalance"
                      onChange={(event) =>
                        setSavingsBalance(event.target.value)
                      }
                      placeholder="75.00"
                      step="0.01"
                      type="number"
                      value={savingsBalance}
                    />
                  </div>
                  {fieldErrors.savingsBalance ? (
                    <small id="savings-balance-error">
                      {fieldErrors.savingsBalance}
                    </small>
                  ) : null}
                </label>
              </>
            ) : null}
          </div>

          {allocation ? (
            <div
              className={`${styles.allocation} ${
                allocation.difference === 0
                  ? styles.balanced
                  : styles.unbalanced
              }`}
              role="status"
            >
              <span>
                Allocated <strong>{currency.format(allocation.allocated / 100)}</strong>
              </span>
              <span>
                {allocation.difference === 0
                  ? "Ready to open both accounts"
                  : allocation.difference > 0
                    ? `${currency.format(allocation.difference / 100)} remaining`
                    : `${currency.format(Math.abs(allocation.difference) / 100)} over total`}
              </span>
            </div>
          ) : null}

          {fieldErrors.allocation ? (
            <div className={styles.allocationError} role="alert">
              {fieldErrors.allocation}
            </div>
          ) : null}
        </fieldset>

        <div className={styles.actions}>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Onboarding customer…" : "Create customer & accounts"}
          </Button>
        </div>
      </form>
    </section>
  );
}
