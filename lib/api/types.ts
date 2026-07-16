export type Role = "ADMIN" | "CUSTOMER";

export type ApiError = {
  error: string;
  fieldErrors?: Record<string, string>;
  message: string;
  path?: string;
  status: number;
  timestamp?: string;
};

export type LoginRequest = {
  password: string;
  username: string;
};

export type LoginResponse = {
  customerId: string | null;
  role: Role;
  username: string;
};

export type Customer = {
  id: string;
  username: string;
};

export type AccountType = "CHECKING" | "SAVINGS";

export type Account = {
  accountNumber: string;
  balance: number;
  customerId: string;
  id: string;
  interestRate: number;
  type: AccountType;
};

export type AdminOverviewResponse = {
  accounts: Account[];
  customers: Customer[];
};

export type InitialAccountRequest = {
  startingBalance: number;
  type: AccountType;
};

export type OnboardCustomerRequest = {
  accounts: InitialAccountRequest[];
  password: string;
  totalStartingBalance: number;
  username: string;
};

export type CustomerOnboardingResponse = {
  accounts: Account[];
  customer: Customer;
};

export type AdminCreateCustomerRequest = {
  admin: LoginRequest;
  onboarding: OnboardCustomerRequest;
};

export type CreateAccountRequest = {
  startingBalance: number;
  type: AccountType;
};

export type AdminCreateAccountRequest = {
  account: CreateAccountRequest;
  admin: LoginRequest;
  customerId: string;
};

export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";

export type BankTransaction = {
  amount: number;
  createdAt: string;
  destinationAccountNumber: string | null;
  id: string;
  sourceAccountNumber: string | null;
  type: TransactionType;
};

export type CustomerOverviewRequest = {
  credentials: LoginRequest;
  customerId: string;
};

export type CustomerOverviewResponse = {
  accounts: Account[];
  transactions: BankTransaction[];
};

export type MoneyMovementOperation =
  | {
      accountNumber: string;
      amount: number;
      type: "DEPOSIT" | "WITHDRAWAL";
    }
  | {
      amount: number;
      destinationAccountNumber: string;
      sourceAccountNumber: string;
      type: "TRANSFER";
    };

export type CustomerMoneyMovementRequest = {
  credentials: LoginRequest;
  operation: MoneyMovementOperation;
};

export type MoneyMovementResponse = {
  account?: Account;
  message: string;
};

export type AdminDeleteTarget =
  | { accountNumber: string; kind: "ACCOUNT" }
  | { customerId: string; kind: "CUSTOMER" };

export type AdminDeleteRequest = {
  admin: LoginRequest;
  target: AdminDeleteTarget;
};

export type AdminDeleteResponse = {
  message: string;
};
