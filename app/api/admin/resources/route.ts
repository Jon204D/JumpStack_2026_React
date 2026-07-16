import axios from "axios";
import { backendUrl, requestBearerAuthorization } from "@/lib/api/server";
import type {
  AdminDeleteRequest,
  AdminDeleteResponse,
  ApiError,
} from "@/lib/api/types";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function errorResponse(status: number, message: string) {
  const body: ApiError = {
    error: status === 401 ? "Unauthorized" : "Deletion Error",
    message,
    status,
  };

  return Response.json(body, { headers: jsonHeaders, status });
}

export async function DELETE(request: Request) {
  let payload: AdminDeleteRequest;

  try {
    payload = (await request.json()) as AdminDeleteRequest;
  } catch {
    return errorResponse(400, "Deletion details are required.");
  }

  const authorization = requestBearerAuthorization(request);
  const target = payload.target;

  if (!authorization) return errorResponse(401, "A Bearer token is required.");
  if (!target) return errorResponse(400, "Deletion details are required.");

  let path: string;
  let successMessage: string;

  if (target.kind === "CUSTOMER" && target.customerId?.trim()) {
    path = `/api/customers/${encodeURIComponent(target.customerId.trim())}`;
    successMessage = "Customer access and active accounts were deleted.";
  } else if (target.kind === "ACCOUNT" && target.accountNumber?.trim()) {
    path = `/api/accounts/${encodeURIComponent(target.accountNumber.trim())}`;
    successMessage = `${target.accountNumber.trim().toUpperCase()} was deleted.`;
  } else {
    return errorResponse(400, "A valid deletion target is required.");
  }

  try {
    const backendResponse = await axios.delete<ApiError | undefined>(
      backendUrl(path).toString(),
      {
        headers: {
          Accept: "application/json",
          Authorization: authorization,
        },
        timeout: 10_000,
        validateStatus: () => true,
      },
    );

    if (backendResponse.status < 200 || backendResponse.status >= 300) {
      const fallback = "The selected resource could not be deleted.";
      const message =
        backendResponse.data &&
        typeof backendResponse.data === "object" &&
        "message" in backendResponse.data
          ? backendResponse.data.message || fallback
          : fallback;
      return errorResponse(backendResponse.status, message);
    }

    const response: AdminDeleteResponse = { message: successMessage };
    return Response.json(response, { headers: jsonHeaders });
  } catch {
    return errorResponse(
      503,
      "The banking service is unavailable. Confirm the backend is running and try again.",
    );
  }
}
