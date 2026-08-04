/**
 * src/types/index.ts
 *
 * Shared TypeScript types for the ISMS Platform frontend.
 * These mirror the contracts defined in backend/src/types (Task 5).
 * Add types here as the backend contract is finalised — never duplicate
 * type definitions inside individual portal route groups.
 */

// ---------------------------------------------------------------------------
// Portal / role identifiers
// ---------------------------------------------------------------------------

export type PortalRole = "super-admin" | "tenant-admin" | "teller" | "member";

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  role: PortalRole;
  tenantId: string | null; // null for super-admin
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

// ---------------------------------------------------------------------------
// Tenant (SACCO branch)
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// Member
// ---------------------------------------------------------------------------

export interface Member {
  id: string;
  tenantId: string;
  memberNumber: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  joinedAt: string;
}

// ---------------------------------------------------------------------------
// Account / balance
// ---------------------------------------------------------------------------

export interface Account {
  id: string;
  memberId: string;
  accountType: "savings" | "shares" | "loan";
  balance: number; // in smallest currency unit (e.g. cents / santim)
  currency: string; // ISO-4217
}

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------

export type TransactionType = "deposit" | "withdrawal" | "transfer" | "fee";

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  reference: string;
  narration: string;
  createdAt: string;
  tellerId: string | null;
}

// ---------------------------------------------------------------------------
// API envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
