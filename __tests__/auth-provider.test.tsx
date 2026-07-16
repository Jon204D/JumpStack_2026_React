import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";

function SessionHarness() {
  const { session, signIn, signOut } = useAuth();

  return (
    <div>
      <span>{session ? `${session.username}:${session.role}` : "signed-out"}</span>
      <button
        onClick={() =>
          signIn({
            accessToken: "customer.jwt",
            customerId: "customer-1",
            expiresAt: Date.now() + 60_000,
            role: "CUSTOMER",
            username: "customer1",
          })
        }
        type="button"
      >
        Sign in
      </button>
      <button onClick={signOut} type="button">
        Sign out
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  it("stores and clears the authenticated session", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SessionHarness />
      </AuthProvider>,
    );

    expect(screen.getByText("signed-out")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("customer1:CUSTOMER")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByText("signed-out")).toBeInTheDocument();
  });

  it("automatically clears a session when its JWT lifetime ends", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T12:00:00Z"));

    const { unmount } = render(
      <AuthProvider>
        <SessionHarness />
      </AuthProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "Sign in" }).click();
    });
    expect(screen.getByText("customer1:CUSTOMER")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("signed-out")).toBeInTheDocument();
    unmount();
    vi.clearAllTimers();
    vi.useRealTimers();
  });
});
