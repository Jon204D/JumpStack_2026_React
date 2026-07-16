import axios from "axios";
import { backendUrl, requestBearerAuthorization } from "@/lib/api/server";
import type {
  AdminResponse,
  ApiError,
  CreateAdminRequest,
} from "@/lib/api/types";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function errorResponse(status: number, message: string) {
  const body: ApiError = {
    error: status === 401 ? "Unauthorized" : "Administrator Creation Error",
    message,
    status,
  };

  return Response.json(body, { headers: jsonHeaders, status });
}

export async function POST(request: Request) {
  let payload: CreateAdminRequest;

  try {
    payload = (await request.json()) as CreateAdminRequest;
  } catch {
    return errorResponse(400, "Administrator credentials are required.");
  }

  const authorization = requestBearerAuthorization(request);
  const username = payload.username?.trim();
  const password = payload.password;

  if (!authorization) return errorResponse(401, "A Bearer token is required.");

  if (!username || username.length > 50 || !password) {
    return errorResponse(400, "Valid administrator credentials are required.");
  }

  try {
    const backendResponse = await axios.post<AdminResponse | ApiError>(
      backendUrl("/api/admins").toString(),
      { password, username },
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
        "The administrator could not be created.",
      );
    }

    return Response.json(backendResponse.data as AdminResponse, {
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
