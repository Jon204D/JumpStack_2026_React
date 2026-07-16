"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MoneyMovementForm } from "@/components/dashboard/MoneyMovementForm";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { apiClient, bearerHeaders } from "@/lib/api/client";
import type {
  ApiError,
  CustomerOverviewRequest,
  CustomerOverviewResponse,
  AuthenticatedSession,
} from "@/lib/api/types";
import styles from "./CustomerDashboard.module.scss";

type CustomerDashboardProps = AuthenticatedSession & {
  customerId: string;
};

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

export function CustomerDashboard({
  customerId,
  accessToken,
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
      customerId,
    };
    const { data } = await apiClient.post<CustomerOverviewResponse>(
      "/customer/overview",
      request,
      { headers: bearerHeaders(accessToken) },
    );
    return data;
  },
    [accessToken, customerId],
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

  async function handleMovementCompleted(message: string) {
    setSuccess(message);
    await refreshOverview();
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
            accessToken={accessToken}
            onCompleted={handleMovementCompleted}
            username={username}
          />

          <TransactionHistory
            accounts={overview.accounts}
            description="Filter your deposits, withdrawals, and transfers by account or transaction type."
            eyebrow="Account activity"
            id="activity"
            mode="CUSTOMER"
            title="Transaction history"
            transactions={overview.transactions}
          />
        </div>
      ) : null}
    </section>
  );
}
