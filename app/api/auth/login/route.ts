import axios from "axios";
import { backendUrl } from "@/lib/api/server";
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
    const backendResponse = await axios.post<LoginResponse | ApiError>(
      backendUrl("/api/auth/login").toString(),
      { password, username },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
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

    return Response.json(backendResponse.data as LoginResponse, {
      headers: jsonHeaders,
    });
  } catch {
    return errorResponse(
      503,
      "The banking service is unavailable. Confirm the backend is running and try again.",
    );
  }
}
