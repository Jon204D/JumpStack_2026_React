"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MoneyMovementForm } from "@/components/dashboard/MoneyMovementForm";
import { apiClient } from "@/lib/api/client";
import type {
  ApiError,
  BankTransaction,
  CustomerOverviewRequest,
  CustomerOverviewResponse,
  LoginRequest,
} from "@/lib/api/types";
import styles from "./CustomerDashboard.module.scss";

type CustomerDashboardProps = LoginRequest & {
  customerId: string;
};

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function CustomerDashboard({
  customerId,
  password,
  username,
}: CustomerDashboardProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overview, setOverview] = useState<CustomerOverviewResponse | null>(
    null,
  );
  const [success, setSuccess] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    const request: CustomerOverviewRequest = {
      credentials: { password, username },
      customerId,
    };
    const { data } = await apiClient.post<CustomerOverviewResponse>(
      "/customer/overview",
      request,
    );
    return data;
  },
    [customerId, password, username],
  );

  useEffect(() => {
    let active = true;

    fetchOverview()
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          axios.isAxiosError<ApiError>(requestError)
            ? requestError.response?.data.message ??
                "Your dashboard could not be loaded."
            : "Your dashboard could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchOverview]);

  async function refreshOverview() {
    setIsRefreshing(true);
    setError(null);

    try {
      setOverview(await fetchOverview());
    } catch (requestError) {
      setError(
        axios.isAxiosError<ApiError>(requestError)
          ? requestError.response?.data.message ??
              "Your dashboard could not be refreshed."
          : "Your dashboard could not be refreshed.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  const totalBalance = useMemo(
    () =>
      overview?.accounts.reduce(
        (sum, account) => sum + Number(account.balance),
        0,
      ) ?? 0,
    [overview],
  );

  const ownedAccountNumbers = useMemo(
    () =>
      new Set(
        overview?.accounts.map((account) => account.accountNumber) ?? [],
      ),
    [overview],
  );

  async function handleMovementCompleted(message: string) {
    setSuccess(message);
    await refreshOverview();
  }

  function transactionDetails(transaction: BankTransaction) {
    if (transaction.type === "DEPOSIT") {
      return {
        amountClass: styles.credit,
        amountPrefix: "+",
        label: "Deposit",
        note: `To ${transaction.destinationAccountNumber}`,
      };
    }
    if (transaction.type === "WITHDRAWAL") {
      return {
        amountClass: styles.debit,
        amountPrefix: "−",
        label: "Withdrawal",
        note: `From ${transaction.sourceAccountNumber}`,
      };
    }

    const ownsSource = ownedAccountNumbers.has(
      transaction.sourceAccountNumber ?? "",
    );
    const ownsDestination = ownedAccountNumbers.has(
      transaction.destinationAccountNumber ?? "",
    );

    if (ownsSource && ownsDestination) {
      return {
        amountClass: styles.neutral,
        amountPrefix: "",
        label: "Transfer between your accounts",
        note: `${transaction.sourceAccountNumber} → ${transaction.destinationAccountNumber}`,
      };
    }

    return ownsSource
      ? {
          amountClass: styles.debit,
          amountPrefix: "−",
          label: "Transfer sent",
          note: `To ${transaction.destinationAccountNumber}`,
        }
      : {
          amountClass: styles.credit,
          amountPrefix: "+",
          label: "Transfer received",
          note: `From ${transaction.sourceAccountNumber}`,
        };
  }

  return (
    <section aria-labelledby="customer-dashboard-title">
      <div className={styles.heading} id="overview">
        <div>
          <p>Personal banking</p>
          <h1 id="customer-dashboard-title">Welcome back, {username}.</h1>
          <span>Your balances and recent activity are up to date.</span>
        </div>
        <div className={styles.totalBalance}>
          <span>Total available</span>
          <strong>{isLoading ? "—" : currency.format(totalBalance)}</strong>
          <small>{overview?.accounts.length ?? 0} active accounts</small>
        </div>
      </div>

      {success ? (
        <div className={styles.success} role="status">
          <span aria-hidden="true">✓</span>
          {success} Balances and activity were refreshed.
        </div>
      ) : null}

      {error ? (
        <div className={styles.error} role="alert">
          {error}
          <button onClick={refreshOverview} type="button">
            Try again
          </button>
        </div>
      ) : null}

      <section className={styles.accountsSection} id="accounts" aria-labelledby="accounts-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>Your accounts</p>
            <h2 id="accounts-title">Every balance at a glance</h2>
          </div>
          {isRefreshing ? <span>Refreshing…</span> : null}
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading your accounts…</div>
        ) : overview?.accounts.length ? (
          <div className={styles.accountGrid}>
            {overview.accounts.map((account) => (
              <article className={styles.accountCard} key={account.id}>
                <div>
                  <span className={styles.accountType}>
                    {account.type === "CHECKING" ? "Checking" : "Savings"}
                  </span>
                  <span className={styles.accountMark} aria-hidden="true">
                    {account.type === "CHECKING" ? "C" : "S"}
                  </span>
                </div>
                <strong>{currency.format(Number(account.balance))}</strong>
                <p>Available balance</p>
                <footer>
                  <span>{account.accountNumber}</span>
                  <span>
                    {(Number(account.interestRate) * 100).toFixed(2)}% APY
                  </span>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.loading}>No active accounts were found.</div>
        )}
      </section>

      {overview?.accounts.length ? (
        <div className={styles.workspaceGrid}>
          <MoneyMovementForm
            accounts={overview.accounts}
            onCompleted={handleMovementCompleted}
            password={password}
            username={username}
          />

          <section className={styles.activity} id="activity" aria-labelledby="activity-title">
            <div className={styles.sectionHeading}>
              <div>
                <p>Recent activity</p>
                <h2 id="activity-title">Transaction history</h2>
              </div>
              <span>{overview.transactions.length} records</span>
            </div>

            {overview.transactions.length ? (
              <ul className={styles.transactionList}>
                {overview.transactions.slice(0, 12).map((transaction) => {
                  const details = transactionDetails(transaction);

                  return (
                    <li key={transaction.id}>
                      <span className={styles.transactionIcon} aria-hidden="true">
                        {transaction.type === "DEPOSIT"
                          ? "+"
                          : transaction.type === "WITHDRAWAL"
                            ? "−"
                            : "→"}
                      </span>
                      <div>
                        <strong>{details.label}</strong>
                        <span>{details.note}</span>
                        <time dateTime={transaction.createdAt}>
                          {dateTime.format(new Date(transaction.createdAt))}
                        </time>
                      </div>
                      <strong className={details.amountClass}>
                        {details.amountPrefix}
                        {currency.format(Number(transaction.amount))}
                      </strong>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className={styles.emptyActivity}>
                <strong>No transactions yet</strong>
                <span>Your first deposit, withdrawal, or transfer will appear here.</span>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
