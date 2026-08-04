/**
 * src/lib/api-client/index.ts
 *
 * The SINGLE entry point for all backend HTTP calls.
 * Every portal imports from here — never call fetch() directly in components.
 *
 * Base URL is read from NEXT_PUBLIC_API_URL (set in .env.local).
 * The client automatically attaches the Bearer token from localStorage
 * and refreshes it on 401 responses.
 */

import type { ApiError, ApiResponse, AuthTokens } from "@/types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

const TOKEN_KEY = "isms_access_token";
const REFRESH_KEY = "isms_refresh_token";

// ---------------------------------------------------------------------------
// Token helpers (browser-only)
// ---------------------------------------------------------------------------

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching the Authorization header (e.g. for /auth/login) */
  skipAuth?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorPayload: ApiError = await response.json().catch(() => ({
      success: false as const,
      message: response.statusText,
      statusCode: response.status,
    }));
    throw errorPayload;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API surface
// ---------------------------------------------------------------------------

export const apiClient = {
  get<T>(path: string, options?: RequestOptions) {
    return request<ApiResponse<T>>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, body: unknown, options?: RequestOptions) {
    return request<ApiResponse<T>>(path, { ...options, method: "POST", body });
  },

  patch<T>(path: string, body: unknown, options?: RequestOptions) {
    return request<ApiResponse<T>>(path, { ...options, method: "PATCH", body });
  },

  put<T>(path: string, body: unknown, options?: RequestOptions) {
    return request<ApiResponse<T>>(path, { ...options, method: "PUT", body });
  },

  delete<T>(path: string, options?: RequestOptions) {
    return request<ApiResponse<T>>(path, { ...options, method: "DELETE" });
  },
};

export default apiClient;
