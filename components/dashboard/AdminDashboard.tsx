"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { AddCustomerForm } from "@/components/dashboard/AddCustomerForm";
import { apiClient } from "@/lib/api/client";
import type {
  AdminOverviewResponse,
  ApiError,
  Customer,
  LoginRequest,
} from "@/lib/api/types";
import styles from "./AdminDashboard.module.scss";

type AdminDashboardProps = LoginRequest;

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

export function AdminDashboard({ password, username }: AdminDashboardProps) {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      try {
        const { data } = await apiClient.post<AdminOverviewResponse>(
          "/admin/overview",
          { password, username },
          { signal: controller.signal },
        );
        setOverview(data);
      } catch (requestError) {
        if (axios.isCancel(requestError)) return;

        setError(
          axios.isAxiosError<ApiError>(requestError)
            ? requestError.response?.data.message ??
                "The dashboard could not be loaded."
            : "The dashboard could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadOverview();
    return () => controller.abort();
  }, [password, username]);

  const totalBalance = useMemo(
    () =>
      overview?.accounts.reduce(
        (sum, account) => sum + Number(account.balance),
        0,
      ) ?? 0,
    [overview],
  );

  function handleCustomerCreated(customer: Customer) {
    setOverview((current) =>
      current
        ? { ...current, customers: [customer, ...current.customers] }
        : { accounts: [], customers: [customer] },
    );
    setSuccess(`${customer.username} now has secure customer access.`);
    setIsAddingCustomer(false);
  }

  function toggleAddCustomer() {
    setSuccess(null);
    setIsAddingCustomer((current) => !current);
  }

  return (
    <section aria-labelledby="dashboard-title">
      <div className={styles.heading}>
        <div>
          <p>Administration overview</p>
          <h1 id="dashboard-title">Good to see you, {username}.</h1>
          <span>Here is the current shape of the bank.</span>
        </div>
        <button
          aria-expanded={isAddingCustomer}
          className={styles.primaryAction}
          onClick={toggleAddCustomer}
          type="button"
        >
          <span aria-hidden="true">{isAddingCustomer ? "×" : "+"}</span>
          {isAddingCustomer ? "Close form" : "Add customer"}
          <small>Secure setup</small>
        </button>
      </div>

      {isAddingCustomer ? (
        <AddCustomerForm
          adminPassword={password}
          adminUsername={username}
          onCancel={() => setIsAddingCustomer(false)}
          onCreated={handleCustomerCreated}
        />
      ) : null}

      {success ? (
        <div className={styles.success} role="status">
          <span aria-hidden="true">✓</span>
          {success}
        </div>
      ) : null}

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <div className={styles.metrics} aria-label="Bank summary">
        <article>
          <p>Customers</p>
          <strong>{isLoading ? "—" : overview?.customers.length ?? 0}</strong>
          <span>Active customer profiles</span>
        </article>
        <article>
          <p>Accounts</p>
          <strong>{isLoading ? "—" : overview?.accounts.length ?? 0}</strong>
          <span>Checking and savings</span>
        </article>
        <article className={styles.balanceMetric}>
          <p>Total managed balance</p>
          <strong>{isLoading ? "—" : currency.format(totalBalance)}</strong>
          <span>Across all active accounts</span>
        </article>
      </div>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="customers-title">
          <div className={styles.panelHeading}>
            <div>
              <p>Customer directory</p>
              <h2 id="customers-title">Recently added</h2>
            </div>
            <span>{overview?.customers.length ?? 0} total</span>
          </div>

          {isLoading ? (
            <div className={styles.state}>Loading customers…</div>
          ) : overview?.customers.length ? (
            <ul className={styles.customerList}>
              {overview.customers.slice(0, 5).map((customer) => {
                const accountCount = overview.accounts.filter(
                  (account) => account.customerId === customer.id,
                ).length;

                return (
                  <li key={customer.id}>
                    <span className={styles.avatar} aria-hidden="true">
                      {customer.username.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <strong>{customer.username}</strong>
                      <span>
                        {accountCount}{" "}
                        {accountCount === 1 ? "account" : "accounts"}
                      </span>
                    </div>
                    <small>Customer</small>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.state}>
              <strong>No customers yet</strong>
              <span>Create the first customer to begin opening accounts.</span>
            </div>
          )}
        </section>

        <aside className={`${styles.panel} ${styles.nextSteps}`}>
          <p>Operations checklist</p>
          <h2>Keep the bank moving</h2>
          <ol>
            <li className={styles.complete}>
              <span>✓</span>
              <div>
                <strong>Authentication ready</strong>
                <small>Admin and customer roles verified</small>
              </div>
            </li>
            <li className={styles.complete}>
              <span>✓</span>
              <div>
                <strong>Add customer workflow</strong>
                <small>Credentials are securely created and linked</small>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Open customer accounts</strong>
                <small>Next design and implementation target</small>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </section>
  );
}
