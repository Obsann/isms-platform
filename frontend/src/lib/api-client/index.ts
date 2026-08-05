/**
 * src/lib/api-client/index.ts
 *
 * The SINGLE entry point for all backend HTTP calls.
 * Every portal imports from here — never call fetch() directly in components.
 *
 * Base URL is read from NEXT_PUBLIC_API_URL (set in .env.local) and defaults to the
 * local API. The client attaches the Bearer token from localStorage.
 *
 * There is no refresh flow: Task 3 deliberately deferred refresh tokens, so a 401
 * means re-authenticate. Callers should route the user back to login rather than
 * retrying.
 */

import type { ApiErrorBody, LoginResponse } from "@/types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** The API listens on 4000 with a global `api` prefix — not 3001, and not versioned. */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const TOKEN_KEY = "isms_access_token";

// ---------------------------------------------------------------------------
// Token helpers (browser-only)
// ---------------------------------------------------------------------------

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(login: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY, login.accessToken);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching the Authorization header (e.g. for /auth/login) */
  skipAuth?: boolean;
}

/**
 * Thrown for any non-2xx response, carrying the API's standard error body so callers
 * can surface `message` without ever showing a raw object or stack trace.
 */
export class ApiRequestError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly messages: string[];

  constructor(body: ApiErrorBody) {
    const messages = Array.isArray(body.message) ? body.message : [body.message];
    super(messages[0] ?? "Request failed");
    this.name = "ApiRequestError";
    this.statusCode = body.statusCode;
    this.error = body.error;
    this.messages = messages;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
    const fallback: ApiErrorBody = {
      statusCode: response.status,
      message: response.statusText || "Request failed",
      error: "RequestFailed",
    };
    const payload = (await response.json().catch(() => fallback)) as ApiErrorBody;
    throw new ApiRequestError(payload);
  }

  // 204 and other empty bodies would otherwise blow up on .json().
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Public API surface
//
// Responses are the resource itself — the backend has no `{ success, data }`
// envelope, so these return `T` directly. List endpoints return
// `PaginatedResult<T>`; ask for that as the type parameter.
// ---------------------------------------------------------------------------

export const apiClient = {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, body: unknown, options?: RequestOptions) {
    return request<T>(path, { ...options, method: "POST", body });
  },

  patch<T>(path: string, body: unknown, options?: RequestOptions) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },

  put<T>(path: string, body: unknown, options?: RequestOptions) {
    return request<T>(path, { ...options, method: "PUT", body });
  },

  delete<T>(path: string, options?: RequestOptions) {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};

export default apiClient;
