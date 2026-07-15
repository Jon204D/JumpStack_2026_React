import axios from "axios";
import { backendUrl, basicAuthorization } from "@/lib/api/server";
import type { ApiError, LoginRequest, LoginResponse } from "@/lib/api/types";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function errorResponse(status: number, message: string) {
  const body: ApiError = {
    error: status === 401 ? "Unauthorized" : "Authentication Error",
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

  try {
    const backendResponse = await axios.get<LoginResponse | ApiError>(
      backendUrl("/api/auth/me").toString(),
      {
        headers: {
          Accept: "application/json",
          Authorization: basicAuthorization(username, password),
        },
        timeout: 10_000,
        validateStatus: () => true,
      },
    );

    if (backendResponse.status === 401) {
      return errorResponse(401, "The username or password is incorrect.");
    }

    if (backendResponse.status < 200 || backendResponse.status >= 300) {
      let message = "The banking service could not verify the account right now.";

      if (
        backendResponse.data &&
        typeof backendResponse.data === "object" &&
        "message" in backendResponse.data
      ) {
        message = backendResponse.data.message || message;
      }

      return errorResponse(backendResponse.status, message);
    }

    const identity = backendResponse.data as LoginResponse;
    const response: LoginResponse = {
      customerId: identity.customerId,
      role: identity.role,
      username: identity.username,
    };
    return Response.json(response, { headers: jsonHeaders });
  } catch {
    return errorResponse(
      503,
      "The banking service is unavailable. Confirm the backend is running and try again.",
    );
  }
}
