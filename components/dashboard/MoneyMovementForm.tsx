"use client";

import axios from "axios";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiClient, bearerHeaders } from "@/lib/api/client";
import type {
  Account,
  ApiError,
  CustomerMoneyMovementRequest,
  AuthenticatedSession,
  MoneyMovementResponse,
  TransactionType,
} from "@/lib/api/types";
import styles from "./MoneyMovementForm.module.scss";

type MoneyMovementFormProps = AuthenticatedSession & {
  accounts: Account[];
  onCompleted: (message: string) => Promise<void>;
};

type FieldErrors = Record<string, string>;

const amountPattern = /^\d{1,15}(\.\d{1,2})?$/;

export function MoneyMovementForm({
  accounts,
  accessToken,
  onCompleted,
}: MoneyMovementFormProps) {
  const [accountNumber, setAccountNumber] = useState(
    accounts[0]?.accountNumber ?? "",
  );
  const [amount, setAmount] = useState("");
  const [destinationAccountNumber, setDestinationAccountNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<TransactionType>("DEPOSIT");

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.accountNumber === accountNumber),
    [accountNumber, accounts],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validationErrors: FieldErrors = {};
    const cleanAmount = amount.trim();
    const numericAmount = Number(cleanAmount);
    const cleanDestination = destinationAccountNumber.trim().toUpperCase();

    if (!accountNumber) validationErrors.accountNumber = "Select an account.";
    if (!amountPattern.test(cleanAmount) || numericAmount <= 0) {
      validationErrors.amount =
        "Enter an amount of at least $0.01 with no more than two decimals.";
    }
    if (
      (type === "WITHDRAWAL" || type === "TRANSFER") &&
      selectedAccount &&
      numericAmount > Number(selectedAccount.balance)
    ) {
      validationErrors.amount = "The amount exceeds the available balance.";
    }
    if (type === "TRANSFER") {
      if (!cleanDestination) {
        validationErrors.destinationAccountNumber =
          "Enter a destination account number.";
      } else if (cleanDestination === accountNumber.toUpperCase()) {
        validationErrors.destinationAccountNumber =
          "Choose a different destination account.";
      }
    }

    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    const operation: CustomerMoneyMovementRequest["operation"] =
      type === "TRANSFER"
        ? {
            amount: numericAmount,
            destinationAccountNumber: cleanDestination,
            sourceAccountNumber: accountNumber,
            type,
          }
        : { accountNumber, amount: numericAmount, type };

    setIsSubmitting(true);

    try {
      const { data } = await apiClient.post<MoneyMovementResponse>(
        "/customer/money-movement",
        {
          operation,
        } satisfies CustomerMoneyMovementRequest,
        { headers: bearerHeaders(accessToken) },
      );
      setAmount("");
      setDestinationAccountNumber("");
      await onCompleted(data.message);
    } catch (requestError) {
      if (axios.isAxiosError<ApiError>(requestError)) {
        setError(
          requestError.response?.data.message ??
            "The transaction could not be completed.",
        );
        setFieldErrors(requestError.response?.data.fieldErrors ?? {});
      } else {
        setError("The transaction could not be completed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.panel} id="money-movement">
      <div className={styles.heading}>
        <div>
          <p>Move money</p>
          <h2>What would you like to do?</h2>
        </div>
        <span>Protected by account ownership checks</span>
      </div>

      <div className={styles.actions} role="group" aria-label="Transaction type">
        {(["DEPOSIT", "WITHDRAWAL", "TRANSFER"] as const).map((action) => (
          <button
            aria-pressed={type === action}
            className={type === action ? styles.activeAction : undefined}
            key={action}
            onClick={() => {
              setError(null);
              setFieldErrors({});
              setType(action);
            }}
            type="button"
          >
            <span aria-hidden="true">
              {action === "DEPOSIT" ? "+" : action === "WITHDRAWAL" ? "−" : "→"}
            </span>
            {action === "WITHDRAWAL"
              ? "Withdraw"
              : action.charAt(0) + action.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className={styles.error} role="alert">
            {error}
          </div>
        ) : null}

        <div className={styles.fields}>
          <label htmlFor="movement-account-number">
            <span>{type === "TRANSFER" ? "From account" : "Account"}</span>
            <select
              aria-describedby={
                fieldErrors.accountNumber ? "movement-account-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.accountNumber)}
              id="movement-account-number"
              name="accountNumber"
              onChange={(event) => setAccountNumber(event.target.value)}
              value={accountNumber}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.accountNumber}>
                  {account.type === "CHECKING" ? "Checking" : "Savings"} · {account.accountNumber}
                </option>
              ))}
            </select>
            {fieldErrors.accountNumber ? (
              <small id="movement-account-error">
                {fieldErrors.accountNumber}
              </small>
            ) : (
              <small className={styles.help}>
                Available: ${Number(selectedAccount?.balance ?? 0).toFixed(2)}
              </small>
            )}
          </label>

          {type === "TRANSFER" ? (
            <label htmlFor="movement-destination-account">
              <span>To account</span>
              <input
                aria-describedby={
                  fieldErrors.destinationAccountNumber
                    ? "destination-account-error"
                    : "destination-account-help"
                }
                aria-invalid={Boolean(fieldErrors.destinationAccountNumber)}
                autoComplete="off"
                id="movement-destination-account"
                list="customer-account-numbers"
                name="destinationAccountNumber"
                onChange={(event) =>
                  setDestinationAccountNumber(event.target.value)
                }
                placeholder="CHK-1234567"
                type="text"
                value={destinationAccountNumber}
              />
              <datalist id="customer-account-numbers">
                {accounts
                  .filter((account) => account.accountNumber !== accountNumber)
                  .map((account) => (
                    <option key={account.id} value={account.accountNumber} />
                  ))}
              </datalist>
              {fieldErrors.destinationAccountNumber ? (
                <small id="destination-account-error">
                  {fieldErrors.destinationAccountNumber}
                </small>
              ) : (
                <small className={styles.help} id="destination-account-help">
                  Enter another valid bank account number.
                </small>
              )}
            </label>
          ) : null}

          <label htmlFor="movement-amount">
            <span>Amount</span>
            <div className={styles.moneyInput}>
              <span aria-hidden="true">$</span>
              <input
                aria-describedby={
                  fieldErrors.amount ? "movement-amount-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.amount)}
                id="movement-amount"
                inputMode="decimal"
                min="0.01"
                name="amount"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={amount}
              />
            </div>
            {fieldErrors.amount ? (
              <small id="movement-amount-error">{fieldErrors.amount}</small>
            ) : null}
          </label>
        </div>

        <div className={styles.submitRow}>
          <p>
            {type === "DEPOSIT"
              ? "Deposits are available immediately."
              : type === "WITHDRAWAL"
                ? "Your balance cannot fall below zero."
                : "The source and destination must be different."}
          </p>
          <Button disabled={isSubmitting || accounts.length === 0} type="submit">
            {isSubmitting ? "Processing…" : `Complete ${type.toLowerCase()}`}
          </Button>
        </div>
      </form>
    </section>
  );
}
