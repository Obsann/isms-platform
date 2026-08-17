/**
 * Shared contracts (Task 5 — Obsan + Melkamu).
 *
 * MIRROR of `backend/src/types/index.ts`. Change one, change the other in the same
 * commit — that is the whole point of the file. Never redefine any of these inside a
 * portal route group.
 *
 * These are API shapes, not database rows. `Member.fullName` and
 * `Account.availableBalance` are computed by the API and exist in no column anywhere.
 */

// ---------------------------------------------------------------------------
// Identifiers and scalars
// ---------------------------------------------------------------------------

export type TenantId = string;
export type StaffId = string;
export type MemberId = string;
export type AccountId = string;
export type LoanId = string;
export type TransactionId = string;

export type Amount = string;
export type CurrencyCode = string;
export type IsoDate = string;
export type IsoDateTime = string;

// ---------------------------------------------------------------------------
// Status unions
// ---------------------------------------------------------------------------

export type TenantStatus = "provisioning" | "active" | "suspended";
export type MemberStatus = "pending" | "active" | "inactive";
/** Manual ID capture only — no live verification (DECISIONS.md D1). */
export type IdType = "national_id" | "passport" | "other";
export type AccountType = "savings" | "share";
export type AccountStatus = "active" | "dormant" | "closed";

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "transfer"
  | "fee"
  | "share-purchase"
  | "loan-disbursement"
  | "loan-repayment";

export type LoanStatus =
  | "draft"
  | "pending-approval"
  | "approved"
  | "rejected"
  | "disbursed"
  | "repaying"
  | "closed"
  | "defaulted";

export type PortalName = "super-admin" | "tenant-admin" | "teller" | "member";

export type RoleName =
  | "super-admin"
  | "tenant-admin"
  | "teller"
  | "loan-officer"
  | "member";

export const ROLE_PORTAL: Readonly<Record<RoleName, PortalName>> = {
  "super-admin": "super-admin",
  "tenant-admin": "tenant-admin",
  "loan-officer": "tenant-admin",
  teller: "teller",
  member: "member",
};

/**
 * Reserved `LoginRequest.tenantCode` for platform super-admin. Not a real tenant —
 * login uses `resolve_platform_staff_by_email` instead of tenant RLS.
 */
export const PLATFORM_TENANT_CODE = "platform";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: StaffId;
  tenantId: TenantId | null;
  email: string;
  fullName: string;
  role: RoleName;
  isActive: boolean;
}

/** Use `PLATFORM_TENANT_CODE` (`"platform"`) for the seeded platform super-admin. */
export interface LoginRequest {
  tenantCode: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

export interface Tenant {
  id: TenantId;
  name: string;
  code: string;
  status: TenantStatus;
  createdAt: IsoDateTime;
}

// ---------------------------------------------------------------------------
// Member
// ---------------------------------------------------------------------------

export interface Member {
  id: MemberId;
  tenantId: TenantId;
  memberNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  /** Government / other ID number as typed by staff — not live-verified. */
  nationalId: string | null;
  /** What kind of ID `nationalId` refers to. Null when no ID was entered. */
  idType: IdType | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: IsoDate | null;
  status: MemberStatus;
  joinedAt: IsoDate | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export interface Account {
  id: AccountId;
  tenantId: TenantId;
  memberId: MemberId;
  accountNumber: string;
  type: AccountType;
  status: AccountStatus;
  balance: Amount;
  heldAmount: Amount;
  availableBalance: Amount;
  currency: CurrencyCode;
  openedAt: IsoDate | null;
}

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------

export interface Transaction {
  id: TransactionId;
  tenantId: TenantId;
  accountId: AccountId;
  type: TransactionType;
  amount: Amount;
  currency: CurrencyCode;
  balanceAfter: Amount;
  reference: string | null;
  narration: string | null;
  postedByStaffId: StaffId | null;
  postedAt: IsoDateTime;
}

// ---------------------------------------------------------------------------
// Loan
// ---------------------------------------------------------------------------

export interface Loan {
  id: LoanId;
  tenantId: TenantId;
  memberId: MemberId;
  principal: Amount;
  outstandingBalance: Amount;
  interestRate: number;
  termMonths: number;
  status: LoanStatus;
  purpose: string | null;
  appliedAt: IsoDateTime;
  approvedAt: IsoDateTime | null;
  disbursedAt: IsoDateTime | null;
  closedAt: IsoDateTime | null;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export interface ReportingSummary {
  tenantId: TenantId;
  asOf: IsoDateTime;
  memberCount: number;
  activeMemberCount: number;
  totalSavings: Amount;
  totalShares: Amount;
  totalLoansOutstanding: Amount;
  loansInArrears: number;
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

export * from './isms';
