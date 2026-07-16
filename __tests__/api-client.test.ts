import { describe, expect, it } from "vitest";
import { apiClient, bearerHeaders } from "@/lib/api/client";

describe("API client", () => {
  it("targets the application API and requests JSON", () => {
    expect(apiClient.defaults.baseURL).toBe("/api");
    expect(apiClient.defaults.headers.Accept).toBe("application/json");
    expect(apiClient.defaults.headers["Content-Type"]).toBe(
      "application/json",
    );
    expect(apiClient.defaults.timeout).toBe(10_000);
  });

  it("formats JWT access tokens as Bearer authorization headers", () => {
    expect(bearerHeaders("signed.jwt.token")).toEqual({
      Authorization: "Bearer signed.jwt.token",
    });
  });
});
