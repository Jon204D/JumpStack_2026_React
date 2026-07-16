import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateAdminForm } from "@/components/dashboard/CreateAdminForm";
import { apiClient } from "@/lib/api/client";

describe("CreateAdminForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an administrator using the signed-in admin bearer token", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        id: "admin-record-2",
        role: "ADMIN",
        username: "branch.admin",
      },
    });
    const user = userEvent.setup();

    render(<CreateAdminForm accessToken="admin.jwt" />);

    await user.type(screen.getByLabelText("Username"), "branch.admin");
    await user.type(screen.getByLabelText("Password"), "securePassword123");
    await user.type(
      screen.getByLabelText("Confirm password"),
      "securePassword123",
    );
    await user.click(
      screen.getByRole("button", { name: "Create administrator" }),
    );

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/admin/admins",
        {
          password: "securePassword123",
          username: "branch.admin",
        },
        { headers: { Authorization: "Bearer admin.jwt" } },
      ),
    );
    expect(screen.getByText("Administrator created")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "branch.admin" })).toBeInTheDocument();
    expect(screen.queryByText("securePassword123")).not.toBeInTheDocument();
  });

  it("blocks submission when the password confirmation does not match", async () => {
    const post = vi.spyOn(apiClient, "post");
    const user = userEvent.setup();

    render(<CreateAdminForm accessToken="admin.jwt" />);

    await user.type(screen.getByLabelText("Username"), "branch.admin");
    await user.type(screen.getByLabelText("Password"), "securePassword123");
    await user.type(screen.getByLabelText("Confirm password"), "different123");
    await user.click(
      screen.getByRole("button", { name: "Create administrator" }),
    );

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("surfaces a duplicate-username response from the backend", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          error: "Conflict",
          message: "Username is already in use",
          status: 409,
        },
      },
    });
    const user = userEvent.setup();

    render(<CreateAdminForm accessToken="admin.jwt" />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "securePassword123");
    await user.type(
      screen.getByLabelText("Confirm password"),
      "securePassword123",
    );
    await user.click(
      screen.getByRole("button", { name: "Create administrator" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Username is already in use",
    );
  });
});
