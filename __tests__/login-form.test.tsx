import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";
import { apiClient } from "@/lib/api/client";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.restoreAllMocks();
  });

  it("signs in with the JWT response and opens the dashboard", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        accessToken: "signed.customer.jwt",
        customerId: "customer-1",
        expiresIn: 900,
        role: "CUSTOMER",
        tokenType: "Bearer",
        username: "customer1",
      },
    });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText("Username"), " customer1 ");
    await user.type(screen.getByLabelText("Password"), "customer123");
    await user.click(screen.getByRole("button", { name: "Sign in securely" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/auth/login", {
        password: "customer123",
        username: "customer1",
      }),
    );
    expect(await screen.findByText("Welcome, customer1.")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("shows a safe fallback when the login service fails", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText("Username"), "customer1");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in securely" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The sign-in service is unavailable. Please try again.",
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
