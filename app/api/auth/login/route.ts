import { backendUrl, basicAuthorization } from "@/lib/api/server";
import type { ApiError, LoginRequest, LoginResponse, Role } from "@/lib/api/types";

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
    const backendResponse = await fetch(backendUrl("/api/customers"), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: basicAuthorization(username, password),
      },
    });

    if (backendResponse.status === 401) {
      return errorResponse(401, "The username or password is incorrect.");
    }

    let role: Role;

    if (backendResponse.ok) {
      role = "ADMIN";
    } else if (backendResponse.status === 403) {
      // This endpoint is admin-only. A successfully authenticated customer is
      // therefore expected to receive 403, while invalid credentials receive 401.
      role = "CUSTOMER";
    } else {
      return errorResponse(
        502,
        "The banking service could not verify the account right now.",
      );
    }

    const response: LoginResponse = { role, username };
    return Response.json(response, { headers: jsonHeaders });
  } catch {
    return errorResponse(
      503,
      "The banking service is unavailable. Confirm the backend is running and try again.",
    );
  }
}
