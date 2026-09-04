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

import { ROLE_PORTAL, type ApiErrorBody, type AuthUser, type LoginRequest, type LoginResponse, type PortalName, type RoleName, type Transaction } from "@/types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** The API listens on 4000 with a global `api` prefix — not 3001, and not versioned. */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const TOKEN_KEY = "isms_access_token";
const USER_KEY = "isms_auth_user";
const EXPIRES_AT_KEY = "isms_token_expires_at";

export const PORTAL_HOME: Readonly<Record<PortalName, string>> = {
  "super-admin": "/super-admin/dashboard",
  "tenant-admin": "/tenant-admin/dashboard",
  teller: "/teller/dashboard",
  member: "/member/dashboard",
};

export function portalHome(role: RoleName): string {
  return PORTAL_HOME[ROLE_PORTAL[role]];
}

// ---------------------------------------------------------------------------
// Token helpers (browser-only)
// ---------------------------------------------------------------------------

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  if (isSessionExpired()) {
    clearSession();
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  if (isSessionExpired()) {
    clearSession();
    return null;
  }
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearSession();
    return null;
  }
}

function isSessionExpired(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(EXPIRES_AT_KEY);
  if (!raw) return false;
  const expiresAt = Number(raw);
  return Number.isFinite(expiresAt) && Date.now() >= expiresAt;
}

export function saveSession(login: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY, login.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(login.user));
  localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + login.expiresIn * 1000));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("isms-auth-changed"));
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("isms_linked_member");
    window.dispatchEvent(new Event("isms-auth-changed"));
  }
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  try {
    const result = await apiClient.post<LoginResponse>("/auth/login", body, { skipAuth: true });
    saveSession(result);
    return result;
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 401) {
      throw err;
    }
    throw err;
  }
}

export function logout(): void {
  clearSession();
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
    if (response.status === 401 && !skipAuth && typeof window !== "undefined") {
      clearSession();
      window.location.assign("/login");
    }

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

// ---------------------------------------------------------------------------
// Members API (Task 10 & 11 — Melkamu)
// ---------------------------------------------------------------------------

import type { Member, PaginatedResult } from '@/types';

export interface CreateMemberPayload {
  /** Optional — omitted on register; server assigns the next unique MEM-#####. */
  memberNumber?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nationalId?: string;
  idType?: 'national_id' | 'passport' | 'other';
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  status?: 'pending' | 'active' | 'inactive';
  joinedAt?: string;
}

export type UpdateMemberPayload = Partial<CreateMemberPayload>;

export interface LegacyRowError {
  row: number;
  field: string;
  message: string;
}

export interface LegacyImportPreview {
  stagingId: string;
  totalRows: number;
  validRows: number;
  errors: LegacyRowError[];
  preview: Record<string, string>[];
}

export interface LegacyImportCommitResult {
  committed: number;
  skipped: number;
}

export function getMembers(params?: { search?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiClient.get<PaginatedResult<Member>>(`/members${qs ? `?${qs}` : ''}`);
}

export function getMember(id: string) {
  return apiClient.get<Member>(`/members/${id}`);
}

export interface MemberAccountInfo {
  id: string;
  tenantId: string;
  memberId: string;
  accountNumber: string;
  type: 'savings' | 'shares';
  status: 'active' | 'suspended' | 'closed';
  balance: string;
  heldAmount: string;
  availableBalance: string;
  currency: string;
  openedAt: string | null;
}

export interface MemberBalanceInfo {
  memberId: string;
  memberNumber: string;
  fullName: string;
  accounts: MemberAccountInfo[];
  asOf: string;
}

export function getMemberBalance(id: string) {
  return apiClient.get<MemberBalanceInfo>(`/members/${encodeURIComponent(id)}/balance`);
}

export function createMember(payload: CreateMemberPayload) {
  return apiClient.post<Member>('/members', payload);
}

export function updateMember(id: string, payload: UpdateMemberPayload) {
  return apiClient.patch<Member>(`/members/${id}`, payload);
}

export function deleteMember(id: string) {
  return apiClient.delete<void>(`/members/${id}`);
}

export async function stageImport(file: File): Promise<LegacyImportPreview> {
  const formData = new FormData();
  formData.append('file', file);
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/members/import/stage`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearSession();
      window.location.assign('/login');
    }
    const fallback: ApiErrorBody = {
      statusCode: res.status,
      message: res.statusText || 'Upload failed',
      error: 'RequestFailed',
    };
    const payload = (await res.json().catch(() => fallback)) as ApiErrorBody;
    throw new ApiRequestError(payload);
  }
  return res.json() as Promise<LegacyImportPreview>;
}

export function commitImport(stagingId: string): Promise<LegacyImportCommitResult> {
  return apiClient.post<LegacyImportCommitResult>(`/members/import/commit/${stagingId}`, {});
}

// ---------------------------------------------------------------------------
// Tenants API (Task 19 — Super Admin Console)
// ---------------------------------------------------------------------------

export interface TenantListItem {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'suspended' | 'provisioning';
  createdAt: string;
  adminEmail?: string;
  members?: number;
}

export interface ProvisionTenantPayload {
  name: string;
  code: string;
  adminEmail?: string;
  status?: 'active' | 'provisioning' | 'suspended';
}

export interface UpdateTenantPayload {
  name?: string;
  status?: 'active' | 'provisioning' | 'suspended';
}

export function getTenants(status?: string) {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient.get<TenantListItem[]>(`/platform/tenants${query}`);
}

export function getTenant(id: string) {
  return apiClient.get<TenantListItem>(`/platform/tenants/${id}`);
}

export function provisionTenant(payload: ProvisionTenantPayload) {
  return apiClient.post<TenantListItem>('/platform/tenants', payload);
}

export function updateTenant(id: string, payload: UpdateTenantPayload) {
  return apiClient.patch<TenantListItem>(`/platform/tenants/${id}`, payload);
}

export function deleteTenant(id: string) {
  return apiClient.delete<void>(`/platform/tenants/${id}`);
}

// ---------------------------------------------------------------------------
// Document & Reporting API (Task 20 — Document & Reporting Engine)
// ---------------------------------------------------------------------------

export interface ReportingSummary {
  tenantId: string;
  asOf: string;
  memberCount: number;
  activeMemberCount: number;
  totalSavings: string;
  totalShares: string;
  totalLoansOutstanding: string;
  loansInArrears: number;
}

export interface TrialBalanceLine {
  account: string;
  debit: string;
  credit: string;
}

export interface TrialBalance {
  lines: TrialBalanceLine[];
  totalDebits: string;
  totalCredits: string;
  balanced: boolean;
}

export function getSavingsSummaryReport() {
  return apiClient.get<ReportingSummary>('/reports/savings-summary');
}

export function getLoanPortfolioReport() {
  return apiClient.get<ReportingSummary>('/reports/loan-portfolio');
}

export function getTrialBalanceReport() {
  return apiClient.get<TrialBalance>('/reports/trial-balance');
}

export function getRecentTransactionsReport(limit = 8) {
  return apiClient.get<Transaction[]>(`/reports/recent-transactions?limit=${limit}`);
}

export async function fetchDocumentHtml(
  type: 'statement' | 'loan-agreement' | 'receipt' | 'share-cert',
  id: string,
  params?: { from?: string; to?: string },
): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('isms_access_token') : null;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

  let path = '';
  if (type === 'statement') {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    path = `/reports/members/${encodeURIComponent(id)}/statement${qs.toString() ? `?${qs}` : ''}`;
  } else if (type === 'loan-agreement') {
    path = `/reports/loans/${encodeURIComponent(id)}/agreement`;
  } else if (type === 'receipt') {
    path = `/reports/transactions/${encodeURIComponent(id)}/receipt`;
  } else {
    path = `/reports/members/${encodeURIComponent(id)}/share-certificate`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to fetch document'));
  return res.text();
}

export default apiClient;
