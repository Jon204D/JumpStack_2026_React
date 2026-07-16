import axios from "axios";
import { backendUrl, requestBearerAuthorization } from "@/lib/api/server";
import type {
  Account,
  AdminCreateAccountRequest,
  ApiError,
} from "@/lib/api/types";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function errorResponse(status: number, message: string) {
  const body: ApiError = {
    error: status === 401 ? "Unauthorized" : "Account Creation Error",
    message,
    status,
  };

  return Response.json(body, { headers: jsonHeaders, status });
}

export async function POST(request: Request) {
  let payload: AdminCreateAccountRequest;

  try {
    payload = (await request.json()) as AdminCreateAccountRequest;
  } catch {
    return errorResponse(400, "Account details are required.");
  }

  const authorization = requestBearerAuthorization(request);
  const customerId = payload.customerId?.trim();

  if (!authorization) return errorResponse(401, "A Bearer token is required.");

  if (
    !customerId ||
    !payload.account?.type ||
    payload.account.startingBalance === null ||
    payload.account.startingBalance === undefined
  ) {
    return errorResponse(400, "Complete account details are required.");
  }

  try {
    const backendResponse = await axios.post<Account | ApiError>(
      backendUrl(
        `/api/customers/${encodeURIComponent(customerId)}/accounts`,
      ).toString(),
      {
        startingBalance: payload.account.startingBalance,
        type: payload.account.type,
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        timeout: 10_000,
        validateStatus: () => true,
      },
    );

    if (backendResponse.status < 200 || backendResponse.status >= 300) {
      if (
        backendResponse.data &&
        typeof backendResponse.data === "object" &&
        "message" in backendResponse.data
      ) {
        return Response.json(backendResponse.data, {
          headers: jsonHeaders,
          status: backendResponse.status,
        });
      }

      return errorResponse(
        backendResponse.status,
        "The account could not be opened.",
      );
    }

    return Response.json(backendResponse.data as Account, {
      headers: jsonHeaders,
      status: 201,
    });
  } catch {
    return errorResponse(
      503,
      "The banking service is unavailable. Confirm the backend is running and try again.",
    );
  }
}
