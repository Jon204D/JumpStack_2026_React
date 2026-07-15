import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});
