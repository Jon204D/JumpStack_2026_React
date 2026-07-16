import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MoneyMovementForm } from "@/components/dashboard/MoneyMovementForm";
import { apiClient } from "@/lib/api/client";
import type { Account } from "@/lib/api/types";

const accounts: Account[] = [
  {
    accountNumber: "CHK-1234567",
    balance: 100,
    customerId: "customer-1",
    id: "checking-1",
    interestRate: 0.01,
    type: "CHECKING",
  },
  {
    accountNumber: "SVG-7654321",
    balance: 250,
    customerId: "customer-1",
    id: "savings-1",
    interestRate: 0.015,
    type: "SAVINGS",
  },
];

describe("MoneyMovementForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks a withdrawal that exceeds the available balance", async () => {
    const post = vi.spyOn(apiClient, "post");
    const user = userEvent.setup();

    render(
      <MoneyMovementForm
        accessToken="customer.jwt"
        accounts={accounts}
        onCompleted={vi.fn()}
        username="customer1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Withdraw" }));
    await user.type(screen.getByRole("spinbutton"), "101");
    await user.click(
      screen.getByRole("button", { name: "Complete withdrawal" }),
    );

    expect(
      screen.getByText("The amount exceeds the available balance."),
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("submits a valid transfer with the customer Bearer token", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: { message: "Transfer completed" },
    });
    const onCompleted = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <MoneyMovementForm
        accessToken="customer.jwt"
        accounts={accounts}
        onCompleted={onCompleted}
        username="customer1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Transfer" }));
    await user.type(screen.getByPlaceholderText("CHK-1234567"), "svg-7654321");
    await user.type(screen.getByRole("spinbutton"), "25");
    await user.click(screen.getByRole("button", { name: "Complete transfer" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/customer/money-movement",
        {
          operation: {
            amount: 25,
            destinationAccountNumber: "SVG-7654321",
            sourceAccountNumber: "CHK-1234567",
            type: "TRANSFER",
          },
        },
        { headers: { Authorization: "Bearer customer.jwt" } },
      ),
    );
    expect(onCompleted).toHaveBeenCalledWith("Transfer completed");
  });
});
