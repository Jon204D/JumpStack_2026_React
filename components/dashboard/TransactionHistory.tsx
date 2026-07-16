"use client";

import { useMemo, useState } from "react";
import type {
  Account,
  BankTransaction,
  Customer,
  TransactionType,
} from "@/lib/api/types";
import styles from "./TransactionHistory.module.scss";

type TransactionHistoryProps = {
  accounts: Account[];
  customers?: Customer[];
  description: string;
  eyebrow: string;
  id: string;
  mode: "ADMIN" | "CUSTOMER";
  title: string;
  transactions: BankTransaction[];
};

type TypeFilter = "ALL" | TransactionType;

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function relatedAccountNumbers(transaction: BankTransaction) {
  return [
    transaction.sourceAccountNumber,
    transaction.destinationAccountNumber,
  ].filter((accountNumber): accountNumber is string => Boolean(accountNumber));
}

function customerPresentation(
  transaction: BankTransaction,
  ownedAccountNumbers: Set<string>,
) {
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
    transaction.sourceAccountNumber?.toLowerCase() ?? "",
  );
  const ownsDestination = ownedAccountNumbers.has(
    transaction.destinationAccountNumber?.toLowerCase() ?? "",
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

function adminPresentation(transaction: BankTransaction) {
  if (transaction.type === "DEPOSIT") {
    return {
      amountClass: styles.credit,
      amountPrefix: "+",
      label: "Deposit",
      note: `Credited to ${transaction.destinationAccountNumber}`,
    };
  }

  if (transaction.type === "WITHDRAWAL") {
    return {
      amountClass: styles.debit,
      amountPrefix: "−",
      label: "Withdrawal",
      note: `Debited from ${transaction.sourceAccountNumber}`,
    };
  }

  return {
    amountClass: styles.neutral,
    amountPrefix: "",
    label: "Account transfer",
    note: `${transaction.sourceAccountNumber} → ${transaction.destinationAccountNumber}`,
  };
}

export function TransactionHistory({
  accounts,
  customers = [],
  description,
  eyebrow,
  id,
  mode,
  title,
  transactions,
}: TransactionHistoryProps) {
  const [accountFilter, setAccountFilter] = useState("ALL");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  const accountByNumber = useMemo(
    () =>
      new Map(
        accounts.map((account) => [
          account.accountNumber.toLowerCase(),
          account,
        ]),
      ),
    [accounts],
  );
  const customerById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );
  const ownedAccountNumbers = useMemo(
    () =>
      new Set(
        accounts.map((account) => account.accountNumber.toLowerCase()),
      ),
    [accounts],
  );
  const customerAccountNumbers = useMemo(() => {
    if (customerFilter === "ALL") return null;
    return new Set(
      accounts
        .filter((account) => account.customerId === customerFilter)
        .map((account) => account.accountNumber.toLowerCase()),
    );
  }, [accounts, customerFilter]);
  const cleanQuery = query.trim().toLowerCase();

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const relatedNumbers = relatedAccountNumbers(transaction);
        const normalizedNumbers = relatedNumbers.map((accountNumber) =>
          accountNumber.toLowerCase(),
        );
        const ownerNames = normalizedNumbers
          .map((accountNumber) => accountByNumber.get(accountNumber))
          .filter((account): account is Account => Boolean(account))
          .map(
            (account) =>
              customerById.get(account.customerId)?.username.toLowerCase() ??
              "",
          );

        return (
          (typeFilter === "ALL" || transaction.type === typeFilter) &&
          (accountFilter === "ALL" ||
            normalizedNumbers.includes(accountFilter.toLowerCase())) &&
          (!customerAccountNumbers ||
            normalizedNumbers.some((accountNumber) =>
              customerAccountNumbers.has(accountNumber),
            )) &&
          (!cleanQuery ||
            transaction.id.toLowerCase().includes(cleanQuery) ||
            normalizedNumbers.some((accountNumber) =>
              accountNumber.includes(cleanQuery),
            ) ||
            ownerNames.some((ownerName) => ownerName.includes(cleanQuery)))
        );
      }),
    [
      accountByNumber,
      accountFilter,
      cleanQuery,
      customerAccountNumbers,
      customerById,
      transactions,
      typeFilter,
    ],
  );

  function ownerLabel(transaction: BankTransaction) {
    const names = relatedAccountNumbers(transaction)
      .map((accountNumber) => accountByNumber.get(accountNumber.toLowerCase()))
      .filter((account): account is Account => Boolean(account))
      .map((account) => customerById.get(account.customerId)?.username)
      .filter((name): name is string => Boolean(name));
    const uniqueNames = Array.from(new Set(names));

    return uniqueNames.length ? uniqueNames.join(" / ") : "Closed account record";
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={styles.history}
      data-mode={mode}
      id={id}
    >
      <div className={styles.heading}>
        <div>
          <p>{eyebrow}</p>
          <h2 id={`${id}-title`}>{title}</h2>
          <span>{description}</span>
        </div>
        <strong>
          {filteredTransactions.length} of {transactions.length} records
        </strong>
      </div>

      <div className={styles.filters}>
        <label className={styles.search}>
          <span>Search</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              mode === "ADMIN"
                ? "Customer, account, or transaction ID"
                : "Account or transaction ID"
            }
            type="search"
            value={query}
          />
        </label>

        {mode === "ADMIN" ? (
          <label>
            <span>Customer</span>
            <select
              onChange={(event) => setCustomerFilter(event.target.value)}
              value={customerFilter}
            >
              <option value="ALL">All customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.username}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label>
          <span>Account</span>
          <select
            onChange={(event) => setAccountFilter(event.target.value)}
            value={accountFilter}
          >
            <option value="ALL">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.accountNumber}>
                {account.accountNumber}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Type</span>
          <select
            onChange={(event) =>
              setTypeFilter(event.target.value as TypeFilter)
            }
            value={typeFilter}
          >
            <option value="ALL">All types</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="TRANSFER">Transfers</option>
          </select>
        </label>
      </div>

      {filteredTransactions.length ? (
        <ul className={styles.transactionList}>
          {filteredTransactions.map((transaction) => {
            const presentation =
              mode === "CUSTOMER"
                ? customerPresentation(transaction, ownedAccountNumbers)
                : adminPresentation(transaction);

            return (
              <li key={transaction.id}>
                <span className={styles.transactionIcon} aria-hidden="true">
                  {transaction.type === "DEPOSIT"
                    ? "+"
                    : transaction.type === "WITHDRAWAL"
                      ? "−"
                      : "→"}
                </span>
                <div className={styles.transactionDetails}>
                  <strong>{presentation.label}</strong>
                  <span>{presentation.note}</span>
                  {mode === "ADMIN" ? (
                    <small>{ownerLabel(transaction)}</small>
                  ) : null}
                </div>
                <time dateTime={transaction.createdAt}>
                  {dateTime.format(new Date(transaction.createdAt))}
                </time>
                <strong className={presentation.amountClass}>
                  {presentation.amountPrefix}
                  {currency.format(Number(transaction.amount))}
                </strong>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={styles.emptyState}>
          <strong>
            {transactions.length ? "No matching transactions" : "No transactions yet"}
          </strong>
          <span>
            {transactions.length
              ? "Adjust the filters to see more of the ledger."
              : "Deposits, withdrawals, and transfers will appear here."}
          </span>
        </div>
      )}
    </section>
  );
}
