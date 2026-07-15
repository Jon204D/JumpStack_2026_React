import axios from "axios";
import { backendUrl, basicAuthorization } from "@/lib/api/server";
import type {
  AdminCreateCustomerRequest,
  ApiError,
  CustomerOnboardingResponse,
} from "@/lib/api/types";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function errorResponse(status: number, message: string) {
  const body: ApiError = {
    error: status === 401 ? "Unauthorized" : "Customer Creation Error",
    message,
    status,
  };

  return Response.json(body, { headers: jsonHeaders, status });
}

export async function POST(request: Request) {
  let payload: AdminCreateCustomerRequest;

  try {
    payload = (await request.json()) as AdminCreateCustomerRequest;
  } catch {
    return errorResponse(400, "Customer details are required.");
  }

  const adminUsername = payload.admin?.username?.trim();
  const adminPassword = payload.admin?.password;
  const onboarding = payload.onboarding;
  const customerUsername = onboarding?.username?.trim();
  const customerPassword = onboarding?.password;

  if (!adminUsername || !adminPassword) {
    return errorResponse(401, "Administrator authentication is required.");
  }

  if (
    !customerUsername ||
    !customerPassword ||
    onboarding.totalStartingBalance === null ||
    onboarding.totalStartingBalance === undefined ||
    !onboarding.accounts?.length
  ) {
    return errorResponse(400, "Complete customer onboarding details are required.");
  }

  try {
    const backendResponse = await axios.post<CustomerOnboardingResponse | ApiError>(
      backendUrl("/api/customers").toString(),
      {
        password: customerPassword,
        totalStartingBalance: onboarding.totalStartingBalance,
        username: customerUsername,
        accounts: onboarding.accounts,
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: basicAuthorization(adminUsername, adminPassword),
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
        "The customer could not be created.",
      );
    }

    return Response.json(backendResponse.data as CustomerOnboardingResponse, {
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
