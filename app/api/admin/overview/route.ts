import axios from "axios";
import { backendUrl, basicAuthorization } from "@/lib/api/server";
import type {
  Account,
  AdminOverviewResponse,
  ApiError,
  BankTransaction,
  Customer,
  LoginRequest,
} from "@/lib/api/types";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function errorResponse(status: number, message: string) {
  const body: ApiError = {
    error: status === 401 ? "Unauthorized" : "Dashboard Error",
    message,
    status,
  };

  return Response.json(body, { headers: jsonHeaders, status });
}

export async function POST(request: Request) {
  let credentials: LoginRequest;

  try {
    credentials = (await request.json()) as LoginRequest;
  } catch {
    return errorResponse(400, "A username and password are required.");
  }

  const username = credentials.username?.trim();
  const password = credentials.password;

  if (!username || !password) {
    return errorResponse(400, "A username and password are required.");
  }

  const requestConfig = {
    headers: {
      Accept: "application/json",
      Authorization: basicAuthorization(username, password),
    },
    timeout: 10_000,
    validateStatus: () => true,
  };

  try {
    const [customersResponse, accountsResponse, transactionsResponse] =
      await Promise.all([
      axios.get<Customer[] | ApiError>(
        backendUrl("/api/customers").toString(),
        requestConfig,
      ),
      axios.get<Account[] | ApiError>(
        backendUrl("/api/accounts").toString(),
        requestConfig,
      ),
      axios.get<BankTransaction[] | ApiError>(
        backendUrl("/api/transactions").toString(),
        requestConfig,
      ),
    ]);

    const failedResponse = [
      customersResponse,
      accountsResponse,
      transactionsResponse,
    ].find((response) => response.status < 200 || response.status >= 300);

    if (failedResponse) {
      const fallback =
        failedResponse.status === 403
          ? "Administrator access is required to view this dashboard."
          : "The banking service could not load the dashboard right now.";
      const data = failedResponse.data;
      const message =
        data && typeof data === "object" && "message" in data
          ? data.message || fallback
          : fallback;

      return errorResponse(failedResponse.status, message);
    }

    const response: AdminOverviewResponse = {
      accounts: accountsResponse.data as Account[],
      customers: customersResponse.data as Customer[],
      transactions: transactionsResponse.data as BankTransaction[],
    };

    return Response.json(response, { headers: jsonHeaders });
  } catch {
    return errorResponse(
      503,
      "The banking service is unavailable. Confirm the backend is running and try again.",
    );
  }
}
