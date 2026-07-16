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
  accessToken: string;
  customerId: string | null;
  expiresIn: number;
  role: Role;
  tokenType: "Bearer";
  username: string;
};

export type AuthenticatedSession = {
  accessToken: string;
  username: string;
};

export type CreateAdminRequest = {
  password: string;
  username: string;
};

export type AdminResponse = {
  id: string;
  role: "ADMIN";
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
  transactions: BankTransaction[];
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
  onboarding: OnboardCustomerRequest;
};

export type UpdateCustomerRequest = {
  password?: string;
  username?: string;
};

export type AdminUpdateCustomerRequest = {
  customerId: string;
  update: UpdateCustomerRequest;
};

export type CreateAccountRequest = {
  startingBalance: number;
  type: AccountType;
};

export type AdminCreateAccountRequest = {
  account: CreateAccountRequest;
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
  target: AdminDeleteTarget;
};

export type AdminDeleteResponse = {
  message: string;
};
