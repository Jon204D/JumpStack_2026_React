import axios from "axios";
import { backendUrl, requestBearerAuthorization } from "@/lib/api/server";
import type {
  AdminCreateCustomerRequest,
  AdminUpdateCustomerRequest,
  ApiError,
  Customer,
  CustomerOnboardingResponse,
} from "@/lib/api/types";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function errorResponse(
  status: number,
  message: string,
  error = "Customer Management Error",
) {
  const body: ApiError = {
    error: status === 401 ? "Unauthorized" : error,
    message,
    status,
  };

  return Response.json(body, { headers: jsonHeaders, status });
}

export async function PATCH(request: Request) {
  let payload: AdminUpdateCustomerRequest;

  try {
    payload = (await request.json()) as AdminUpdateCustomerRequest;
  } catch {
    return errorResponse(400, "Customer updates are required.");
  }

  const authorization = requestBearerAuthorization(request);
  const customerId = payload.customerId?.trim();
  const update = payload.update;

  if (!authorization) return errorResponse(401, "A Bearer token is required.");

  if (!customerId || !update || (!update.username && !update.password)) {
    return errorResponse(
      400,
      "Provide a customer and at least one access change.",
    );
  }

  try {
    const backendResponse = await axios.patch<Customer | ApiError>(
      backendUrl(`/api/customers/${encodeURIComponent(customerId)}`).toString(),
      update,
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
        "The customer access details could not be updated.",
      );
    }

    return Response.json(backendResponse.data as Customer, {
      headers: jsonHeaders,
      status: 200,
    });
  } catch {
    return errorResponse(
      503,
      "The banking service is unavailable. Confirm the backend is running and try again.",
    );
  }
}

export async function POST(request: Request) {
  let payload: AdminCreateCustomerRequest;

  try {
    payload = (await request.json()) as AdminCreateCustomerRequest;
  } catch {
    return errorResponse(400, "Customer details are required.");
  }

  const authorization = requestBearerAuthorization(request);
  const onboarding = payload.onboarding;
  const customerUsername = onboarding?.username?.trim();
  const customerPassword = onboarding?.password;

  if (!authorization) return errorResponse(401, "A Bearer token is required.");

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
