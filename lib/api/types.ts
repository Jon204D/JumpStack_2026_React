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
