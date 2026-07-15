export type Role = 'ADMIN' | 'CUSTOMER';
export type AccountType = 'CHECKING' | 'SAVINGS';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';

export interface CustomerResponse {
  id: string;
  username: string;
}

export interface AccountResponse {
  id: string;
  accountNumber: string;
  customerId: string;
  type: AccountType;
  balance: number;
  interestRate: number;
}

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  sourceAccountNumber: string | null;
  destinationAccountNumber: string | null;
  amount: number;
  createdAt: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: Record<string, string>;
}

export interface SessionUser {
  username: string;
  role: Role;
  customerId?: string;
}

export const mockSessionUsers: SessionUser[] = [
  { username: 'admin', role: 'ADMIN' },
  { username: 'jsmith', role: 'CUSTOMER', customerId: 'cust-1001' },
];

export const mockCustomers: CustomerResponse[] = [
  { id: 'cust-1001', username: 'jsmith' },
  { id: 'cust-1002', username: 'adoe' },
  { id: 'cust-1003', username: 'mluna' },
];

export const mockAccounts: AccountResponse[] = [
  {
    id: 'acc-501',
    accountNumber: 'CHK-100001',
    customerId: 'cust-1001',
    type: 'CHECKING',
    balance: 2450.33,
    interestRate: 0,
  },
  {
    id: 'acc-502',
    accountNumber: 'SAV-100001',
    customerId: 'cust-1001',
    type: 'SAVINGS',
    balance: 12100.0,
    interestRate: 1.35,
  },
  {
    id: 'acc-503',
    accountNumber: 'CHK-200001',
    customerId: 'cust-1002',
    type: 'CHECKING',
    balance: 980.75,
    interestRate: 0,
  },
];

export const mockTransactionsByAccount: Record<string, TransactionResponse[]> = {
  'CHK-100001': [
    {
      id: 'txn-9001',
      type: 'DEPOSIT',
      sourceAccountNumber: null,
      destinationAccountNumber: 'CHK-100001',
      amount: 500,
      createdAt: '2026-07-15T08:00:00Z',
    },
    {
      id: 'txn-9002',
      type: 'TRANSFER',
      sourceAccountNumber: 'CHK-100001',
      destinationAccountNumber: 'CHK-200001',
      amount: 125.25,
      createdAt: '2026-07-15T12:30:00Z',
    },
  ],
  'SAV-100001': [
    {
      id: 'txn-9011',
      type: 'DEPOSIT',
      sourceAccountNumber: null,
      destinationAccountNumber: 'SAV-100001',
      amount: 1000,
      createdAt: '2026-07-14T09:45:00Z',
    },
  ],
  'CHK-200001': [
    {
      id: 'txn-9021',
      type: 'WITHDRAWAL',
      sourceAccountNumber: 'CHK-200001',
      destinationAccountNumber: null,
      amount: 50,
      createdAt: '2026-07-14T17:10:00Z',
    },
  ],
};

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
