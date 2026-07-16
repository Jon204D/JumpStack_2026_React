"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { AddAccountForm } from "@/components/dashboard/AddAccountForm";
import { AddCustomerForm } from "@/components/dashboard/AddCustomerForm";
import { AdminManagement } from "@/components/dashboard/AdminManagement";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { apiClient, bearerHeaders } from "@/lib/api/client";
import type {
  Account,
  AdminDeleteTarget,
  AdminOverviewResponse,
  ApiError,
  Customer,
  CustomerOnboardingResponse,
  AuthenticatedSession,
} from "@/lib/api/types";
import styles from "./AdminDashboard.module.scss";

type AdminDashboardProps = AuthenticatedSession;

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

export function AdminDashboard({ accessToken, username }: AdminDashboardProps) {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      try {
        const { data } = await apiClient.post<AdminOverviewResponse>(
          "/admin/overview",
          undefined,
          {
            headers: bearerHeaders(accessToken),
            signal: controller.signal,
          },
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
  }, [accessToken]);

  const totalBalance = useMemo(
    () =>
      overview?.accounts.reduce(
        (sum, account) => sum + Number(account.balance),
        0,
      ) ?? 0,
    [overview],
  );

  function handleCustomerCreated(result: CustomerOnboardingResponse) {
    setOverview((current) =>
      current
          ? {
            accounts: [...result.accounts, ...current.accounts],
            customers: [result.customer, ...current.customers],
            transactions: current.transactions,
          }
        : {
            accounts: result.accounts,
            customers: [result.customer],
            transactions: [],
          },
    );
    const accountNumbers = result.accounts
      .map((account) => account.accountNumber)
      .join(" and ");
    setSuccess(
      `${result.customer.username} is onboarded with ${accountNumbers}.`,
    );
    setIsAddingCustomer(false);
  }

  function toggleAddCustomer() {
    setSuccess(null);
    setSelectedCustomer(null);
    setIsAddingCustomer((current) => !current);
  }

  function handleOpenAccount(customer: Customer) {
    setSuccess(null);
    setIsAddingCustomer(false);
    setSelectedCustomer((current) =>
      current?.id === customer.id ? null : customer,
    );
  }

  function handleAccountCreated(account: Account) {
    setOverview((current) =>
      current
        ? { ...current, accounts: [account, ...current.accounts] }
        : { accounts: [account], customers: [], transactions: [] },
    );
    setSuccess(
      `${account.accountNumber} is now open for ${selectedCustomer?.username ?? "the customer"}.`,
    );
    setSelectedCustomer(null);
  }

  function handleDeleted(target: AdminDeleteTarget, message: string) {
    setOverview((current) => {
      if (!current) return current;

      if (target.kind === "CUSTOMER") {
        return {
          accounts: current.accounts.filter(
            (account) => account.customerId !== target.customerId,
          ),
          customers: current.customers.filter(
            (customer) => customer.id !== target.customerId,
          ),
          transactions: current.transactions,
        };
      }

      return {
        ...current,
        accounts: current.accounts.filter(
          (account) =>
            account.accountNumber.toLowerCase() !==
            target.accountNumber.toLowerCase(),
        ),
      };
    });

    if (target.kind === "CUSTOMER" && selectedCustomer?.id === target.customerId) {
      setSelectedCustomer(null);
    }
    setSuccess(message);
  }

  function handleCustomerUpdated(customer: Customer, message: string) {
    setOverview((current) =>
      current
        ? {
            ...current,
            customers: current.customers.map((existingCustomer) =>
              existingCustomer.id === customer.id
                ? customer
                : existingCustomer,
            ),
          }
        : current,
    );
    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer(customer);
    }
    setSuccess(message);
  }

  return (
    <section aria-labelledby="dashboard-title">
      <div className={styles.heading} id="overview">
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
          accessToken={accessToken}
          onCancel={() => setIsAddingCustomer(false)}
          onCreated={handleCustomerCreated}
        />
      ) : null}

      {selectedCustomer ? (
        <AddAccountForm
          accessToken={accessToken}
          customer={selectedCustomer}
          onCancel={() => setSelectedCustomer(null)}
          onCreated={handleAccountCreated}
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
                    <button
                      aria-expanded={selectedCustomer?.id === customer.id}
                      className={styles.accountAction}
                      onClick={() => handleOpenAccount(customer)}
                      type="button"
                    >
                      {selectedCustomer?.id === customer.id
                        ? "Close"
                        : "Open account"}
                    </button>
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
                <strong>Customer onboarding</strong>
                <small>Credentials and opening accounts are created together</small>
              </div>
            </li>
            <li className={styles.complete}>
              <span>✓</span>
              <div>
                <strong>Open customer accounts</strong>
                <small>Checking and savings creation is ready</small>
              </div>
            </li>
          </ol>
        </aside>
      </div>

      {overview ? (
        <>
          <AdminManagement
            onCustomerUpdated={handleCustomerUpdated}
            onDeleted={handleDeleted}
            onOpenAccount={handleOpenAccount}
            overview={overview}
            accessToken={accessToken}
            username={username}
          />
          <TransactionHistory
            accounts={overview.accounts}
            customers={overview.customers}
            description="Review every recorded movement across the bank, including retained history for closed accounts."
            eyebrow="Audit trail"
            id="activity"
            mode="ADMIN"
            title="Bank-wide transaction history"
            transactions={overview.transactions}
          />
        </>
      ) : null}
    </section>
  );
}
