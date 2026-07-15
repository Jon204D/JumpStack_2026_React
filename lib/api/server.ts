import "server-only";

const DEFAULT_BACKEND_URL = "http://localhost:8080";

export function backendUrl(path: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_BACKEND_URL;
  return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
}

export function basicAuthorization(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}
