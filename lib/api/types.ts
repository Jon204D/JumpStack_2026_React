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

export type CreateCustomerRequest = {
  password: string;
  username: string;
};

export type AdminCreateCustomerRequest = {
  admin: LoginRequest;
  customer: CreateCustomerRequest;
};

export type CreateAccountRequest = {
  accountNumber: string;
  startingBalance: number;
  type: AccountType;
};

export type AdminCreateAccountRequest = {
  account: CreateAccountRequest;
  admin: LoginRequest;
  customerId: string;
};
