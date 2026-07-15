import axios from "axios";
import { backendUrl, basicAuthorization } from "@/lib/api/server";
import type {
  Account,
  ApiError,
  CustomerMoneyMovementRequest,
  MoneyMovementResponse,
} from "@/lib/api/types";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function errorResponse(status: number, message: string) {
  const body: ApiError = {
    error: status === 401 ? "Unauthorized" : "Money Movement Error",
    message,
    status,
  };

  return Response.json(body, { headers: jsonHeaders, status });
}

export async function POST(request: Request) {
  let payload: CustomerMoneyMovementRequest;

  try {
    payload = (await request.json()) as CustomerMoneyMovementRequest;
  } catch {
    return errorResponse(400, "Transaction details are required.");
  }

  const username = payload.credentials?.username?.trim();
  const password = payload.credentials?.password;
  const operation = payload.operation;
  const supportedType =
    operation?.type === "DEPOSIT" ||
    operation?.type === "WITHDRAWAL" ||
    operation?.type === "TRANSFER";

  if (
    !username ||
    !password ||
    !operation ||
    !supportedType ||
    !(operation.amount > 0)
  ) {
    return errorResponse(400, "Complete transaction details are required.");
  }

  const requestConfig = {
    headers: {
      Accept: "application/json",
      Authorization: basicAuthorization(username, password),
      "Content-Type": "application/json",
    },
    timeout: 10_000,
    validateStatus: () => true,
  };

  let path: string;
  let body: Record<string, number | string>;

  if (operation.type === "TRANSFER") {
    if (!operation.sourceAccountNumber || !operation.destinationAccountNumber) {
      return errorResponse(400, "Source and destination accounts are required.");
    }
    path = "/api/accounts/transfers";
    body = {
      amount: operation.amount,
      destinationAccountNumber: operation.destinationAccountNumber,
      sourceAccountNumber: operation.sourceAccountNumber,
    };
  } else {
    if (!operation.accountNumber) {
      return errorResponse(400, "An account is required.");
    }
    const action = operation.type === "DEPOSIT" ? "deposits" : "withdrawals";
    path = `/api/accounts/${encodeURIComponent(operation.accountNumber)}/${action}`;
    body = { amount: operation.amount };
  }

  try {
    const backendResponse = await axios.post<Account | ApiError | undefined>(
      backendUrl(path).toString(),
      body,
      requestConfig,
    );

    if (backendResponse.status < 200 || backendResponse.status >= 300) {
      const fallback = "The transaction could not be completed.";
      const message =
        backendResponse.data &&
        typeof backendResponse.data === "object" &&
        "message" in backendResponse.data
          ? backendResponse.data.message || fallback
          : fallback;
      return errorResponse(backendResponse.status, message);
    }

    const response: MoneyMovementResponse = {
      account:
        operation.type === "TRANSFER"
          ? undefined
          : (backendResponse.data as Account),
      message:
        operation.type === "DEPOSIT"
          ? "Deposit completed."
          : operation.type === "WITHDRAWAL"
            ? "Withdrawal completed."
            : "Transfer completed.",
    };

    return Response.json(response, { headers: jsonHeaders });
  } catch {
    return errorResponse(
      503,
      "The banking service is unavailable. Confirm the backend is running and try again.",
    );
  }
}
