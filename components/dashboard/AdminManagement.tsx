"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EditCustomerForm } from "@/components/dashboard/EditCustomerForm";
import { apiClient, bearerHeaders } from "@/lib/api/client";
import type {
  Account,
  AdminDeleteRequest,
  AdminDeleteResponse,
  AdminDeleteTarget,
  AdminOverviewResponse,
  ApiError,
  Customer,
  AuthenticatedSession,
} from "@/lib/api/types";
import styles from "./AdminManagement.module.scss";

type AdminManagementProps = AuthenticatedSession & {
  onCustomerUpdated: (customer: Customer, message: string) => void;
  onDeleted: (target: AdminDeleteTarget, message: string) => void;
  onOpenAccount: (customer: Customer) => void;
  overview: AdminOverviewResponse;
};

type ManagementView = "CUSTOMERS" | "ACCOUNTS";
type PendingDeletion =
  | { account: Account; kind: "ACCOUNT" }
  | { customer: Customer; kind: "CUSTOMER" };

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

export function AdminManagement({
  onCustomerUpdated,
  onDeleted,
  onOpenAccount,
  overview,
  accessToken,
  username,
}: AdminManagementProps) {
  const [error, setError] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDeletion, setPendingDeletion] =
    useState<PendingDeletion | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [view, setView] = useState<ManagementView>("CUSTOMERS");

  useEffect(() => {
    function syncViewWithNavigation() {
      if (window.location.hash === "#accounts") setView("ACCOUNTS");
      if (window.location.hash === "#customers") setView("CUSTOMERS");
    }

    window.addEventListener("hashchange", syncViewWithNavigation);
    return () =>
      window.removeEventListener("hashchange", syncViewWithNavigation);
  }, []);

  const customerById = useMemo(
    () => new Map(overview.customers.map((customer) => [customer.id, customer])),
    [overview.customers],
  );
  const cleanQuery = query.trim().toLowerCase();
  const filteredCustomers = useMemo(
    () =>
      overview.customers.filter((customer) => {
        if (!cleanQuery) return true;
        const accountNumbers = overview.accounts
          .filter((account) => account.customerId === customer.id)
          .map((account) => account.accountNumber.toLowerCase());
        return (
          customer.username.toLowerCase().includes(cleanQuery) ||
          customer.id.toLowerCase().includes(cleanQuery) ||
          accountNumbers.some((accountNumber) =>
            accountNumber.includes(cleanQuery),
          )
        );
      }),
    [cleanQuery, overview.accounts, overview.customers],
  );
  const filteredAccounts = useMemo(
    () =>
      overview.accounts.filter((account) => {
        if (!cleanQuery) return true;
        const owner = customerById.get(account.customerId)?.username ?? "";
        return (
          account.accountNumber.toLowerCase().includes(cleanQuery) ||
          account.type.toLowerCase().includes(cleanQuery) ||
          owner.toLowerCase().includes(cleanQuery)
        );
      }),
    [cleanQuery, customerById, overview.accounts],
  );
  const selectedCustomer = selectedCustomerId
    ? customerById.get(selectedCustomerId)
    : undefined;
  const selectedAccounts = selectedCustomer
    ? overview.accounts.filter(
        (account) => account.customerId === selectedCustomer.id,
      )
    : [];

  async function confirmDeletion() {
    if (!pendingDeletion) return;
    setError(null);
    setIsDeleting(true);

    const target: AdminDeleteTarget =
      pendingDeletion.kind === "CUSTOMER"
        ? { customerId: pendingDeletion.customer.id, kind: "CUSTOMER" }
        : {
            accountNumber: pendingDeletion.account.accountNumber,
            kind: "ACCOUNT",
          };
    const request: AdminDeleteRequest = {
      target,
    };

    try {
      const { data } = await apiClient.delete<AdminDeleteResponse>(
        "/admin/resources",
        {
          data: request,
          headers: bearerHeaders(accessToken),
        },
      );
      if (
        target.kind === "CUSTOMER" &&
        selectedCustomerId === target.customerId
      ) {
        setSelectedCustomerId(null);
      }
      setPendingDeletion(null);
      onDeleted(target, data.message);
    } catch (requestError) {
      setError(
        axios.isAxiosError<ApiError>(requestError)
          ? requestError.response?.data.message ??
              "The selected resource could not be deleted."
          : "The selected resource could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section
      aria-labelledby="management-title"
      className={styles.management}
      id="customers"
    >
      <div className={styles.heading}>
        <div>
          <p>Bank operations</p>
          <h2 id="management-title">Customer and account management</h2>
          <span>Search records, inspect ownership, or remove active access.</span>
        </div>
        <label className={styles.search}>
          <span className={styles.visuallyHidden}>
            Search customers and accounts
          </span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or account…"
            type="search"
            value={query}
          />
        </label>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Management view">
        <button
          aria-selected={view === "CUSTOMERS"}
          className={view === "CUSTOMERS" ? styles.activeTab : undefined}
          onClick={() => setView("CUSTOMERS")}
          role="tab"
          type="button"
        >
          Customers <span>{overview.customers.length}</span>
        </button>
        <button
          aria-selected={view === "ACCOUNTS"}
          className={view === "ACCOUNTS" ? styles.activeTab : undefined}
          id="accounts"
          onClick={() => setView("ACCOUNTS")}
          role="tab"
          type="button"
        >
          Accounts <span>{overview.accounts.length}</span>
        </button>
      </div>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <div className={styles.tableWrap} role="tabpanel">
        {view === "CUSTOMERS" ? (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Accounts</th>
                <th>Managed balance</th>
                <th>
                  <span className={styles.visuallyHidden}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const accounts = overview.accounts.filter(
                  (account) => account.customerId === customer.id,
                );
                const balance = accounts.reduce(
                  (sum, account) => sum + Number(account.balance),
                  0,
                );

                return (
                  <tr key={customer.id}>
                    <td>
                      <span className={styles.avatar} aria-hidden="true">
                        {customer.username.slice(0, 2).toUpperCase()}
                      </span>
                      <span className={styles.primaryCell}>
                        <strong>{customer.username}</strong>
                        <small>ID · {customer.id.slice(-8)}</small>
                      </span>
                    </td>
                    <td>{accounts.length}</td>
                    <td>{currency.format(balance)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          onClick={() =>
                            setSelectedCustomerId((current) =>
                              current === customer.id ? null : customer.id,
                            )
                          }
                          type="button"
                        >
                          {selectedCustomerId === customer.id
                            ? "Close"
                            : "Details"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCustomer(customer);
                            setSelectedCustomerId(null);
                            setPendingDeletion(null);
                          }}
                          type="button"
                        >
                          Edit access
                        </button>
                        <button
                          onClick={() => onOpenAccount(customer)}
                          type="button"
                        >
                          Add account
                        </button>
                        <button
                          className={styles.dangerAction}
                          onClick={() =>
                            setPendingDeletion({ customer, kind: "CUSTOMER" })
                          }
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Balance</th>
                <th>
                  <span className={styles.visuallyHidden}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    <strong>{account.accountNumber}</strong>
                  </td>
                  <td>
                    {customerById.get(account.customerId)?.username ??
                      "Unknown"}
                  </td>
                  <td>
                    <span className={styles.typeBadge}>{account.type}</span>
                  </td>
                  <td>{currency.format(Number(account.balance))}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.dangerAction}
                        onClick={() =>
                          setPendingDeletion({ account, kind: "ACCOUNT" })
                        }
                        type="button"
                      >
                        Delete account
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(view === "CUSTOMERS" ? filteredCustomers : filteredAccounts)
          .length === 0 ? (
          <div className={styles.emptyState}>
            <strong>No matching records</strong>
            <span>Try a different customer name or account number.</span>
          </div>
        ) : null}
      </div>

      {editingCustomer ? (
        <EditCustomerForm
          customer={editingCustomer}
          accessToken={accessToken}
          onCancel={() => setEditingCustomer(null)}
          onUpdated={(customer, message) => {
            setEditingCustomer(null);
            onCustomerUpdated(customer, message);
          }}
          username={username}
        />
      ) : null}

      {selectedCustomer ? (
        <aside
          aria-label={`${selectedCustomer.username} details`}
          className={styles.customerDetails}
        >
          <div>
            <p>Selected customer</p>
            <h3>{selectedCustomer.username}</h3>
            <span>{selectedAccounts.length} active accounts</span>
          </div>
          <ul>
            {selectedAccounts.map((account) => (
              <li key={account.id}>
                <span>{account.type === "CHECKING" ? "Checking" : "Savings"}</span>
                <strong>{account.accountNumber}</strong>
                <span>{currency.format(Number(account.balance))}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      {pendingDeletion ? (
        <section
          aria-labelledby="delete-title"
          aria-modal="true"
          className={styles.confirmation}
          role="alertdialog"
        >
          <div>
            <span aria-hidden="true" className={styles.warning}>
              !
            </span>
            <div>
              <p>Destructive action</p>
              <h3 id="delete-title">
                Delete{" "}
                {pendingDeletion.kind === "CUSTOMER"
                  ? pendingDeletion.customer.username
                  : pendingDeletion.account.accountNumber}
                ?
              </h3>
              <span>
                {pendingDeletion.kind === "CUSTOMER"
                  ? "This removes the customer login and every active account."
                  : "This removes the active account and prevents future transactions."}
                {" "}
                Historical transaction records remain available for audit
                purposes.
              </span>
            </div>
          </div>
          <div className={styles.confirmActions}>
            <Button
              disabled={isDeleting}
              onClick={() => setPendingDeletion(null)}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <button
              className={styles.confirmDelete}
              disabled={isDeleting}
              onClick={confirmDeletion}
              type="button"
            >
              {isDeleting ? "Deleting…" : "Yes, delete permanently"}
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
