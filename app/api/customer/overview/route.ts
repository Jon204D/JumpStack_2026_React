import axios from "axios";
import { backendUrl, basicAuthorization } from "@/lib/api/server";
import type {
  Account,
  ApiError,
  BankTransaction,
  CustomerOverviewRequest,
  CustomerOverviewResponse,
} from "@/lib/api/types";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function errorResponse(status: number, message: string) {
  const body: ApiError = {
    error: status === 401 ? "Unauthorized" : "Customer Dashboard Error",
    message,
    status,
  };

  return Response.json(body, { headers: jsonHeaders, status });
}

function messageFrom(data: unknown, fallback: string) {
  return data && typeof data === "object" && "message" in data
    ? String(data.message || fallback)
    : fallback;
}

export async function POST(request: Request) {
  let payload: CustomerOverviewRequest;

  try {
    payload = (await request.json()) as CustomerOverviewRequest;
  } catch {
    return errorResponse(400, "Customer session details are required.");
  }

  const username = payload.credentials?.username?.trim();
  const password = payload.credentials?.password;
  const customerId = payload.customerId?.trim();

  if (!username || !password || !customerId) {
    return errorResponse(400, "Customer session details are required.");
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
    const accountsResponse = await axios.get<Account[] | ApiError>(
      backendUrl(
        `/api/customers/${encodeURIComponent(customerId)}/accounts`,
      ).toString(),
      requestConfig,
    );

    if (accountsResponse.status < 200 || accountsResponse.status >= 300) {
      return errorResponse(
        accountsResponse.status,
        messageFrom(
          accountsResponse.data,
          "Your accounts could not be loaded right now.",
        ),
      );
    }

    const accounts = accountsResponse.data as Account[];
    const historyResponses = await Promise.all(
      accounts.map((account) =>
        axios.get<BankTransaction[] | ApiError>(
          backendUrl(
            `/api/accounts/${encodeURIComponent(account.accountNumber)}/transactions`,
          ).toString(),
          requestConfig,
        ),
      ),
    );
    const failedHistory = historyResponses.find(
      (response) => response.status < 200 || response.status >= 300,
    );

    if (failedHistory) {
      return errorResponse(
        failedHistory.status,
        messageFrom(
          failedHistory.data,
          "Your transaction history could not be loaded right now.",
        ),
      );
    }

    const transactions = Array.from(
      new Map(
        historyResponses
          .flatMap((response) => response.data as BankTransaction[])
          .map((transaction) => [transaction.id, transaction]),
      ).values(),
    ).sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
    const response: CustomerOverviewResponse = { accounts, transactions };

    return Response.json(response, { headers: jsonHeaders });
  } catch {
    return errorResponse(
      503,
      "The banking service is unavailable. Confirm the backend is running and try again.",
    );
  }
}
