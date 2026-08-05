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

/**
 * Money, always. A decimal string like `"45230.00"` — never a number.
 *
 * The backend stores money as `numeric(18,2)` and returns it as a string precisely
 * because binary floating point cannot represent cents exactly. Do not `parseFloat`
 * an `Amount` — not to compare it, not to sum it, and not to format it. Render it
 * with `formatCurrency` from `@/components/format`, which works on the string
 * directly. Arithmetic belongs on the server, in the ledger.
 */
export type Amount = string;

/** ISO-4217, e.g. `"ETB"`. */
export type CurrencyCode = string;

/** Calendar date with no time component, `YYYY-MM-DD`. */
export type IsoDate = string;

/** Full ISO-8601 timestamp with offset. */
export type IsoDateTime = string;

// ---------------------------------------------------------------------------
// Status unions
// ---------------------------------------------------------------------------

export type TenantStatus = "provisioning" | "active" | "suspended";
export type MemberStatus = "pending" | "active" | "inactive";
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

// ---------------------------------------------------------------------------
// Roles and portals
//
// A role is *not* a portal. `role` is the authorization identity stored on the staff
// account; a portal is which UI shell someone lands in. They look similar today, but
// a loan officer is a distinct role that still lands in the tenant-admin portal — so
// the mapping is explicit rather than assumed to be an identity function.
// ---------------------------------------------------------------------------

export type PortalName = "super-admin" | "tenant-admin" | "teller" | "member";

export type RoleName =
  | "super-admin"
  | "tenant-admin"
  | "teller"
  | "loan-officer"
  | "member";

/** Which portal each role lands in after login — the Task 4 redirect table. */
export const ROLE_PORTAL: Readonly<Record<RoleName, PortalName>> = {
  "super-admin": "super-admin",
  "tenant-admin": "tenant-admin",
  "loan-officer": "tenant-admin",
  teller: "teller",
  member: "member",
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: StaffId;
  /** `null` is platform-level (Super Admin) staff, who sit outside tenant scoping. */
  tenantId: TenantId | null;
  email: string;
  fullName: string;
  role: RoleName;
  isActive: boolean;
}

/**
 * `tenantCode` is required. Staff accounts are fail-closed under row-level security
 * on the backend, so there is no "find the user, then infer their tenant" path — the
 * login form must collect a tenant code alongside the credentials.
 */
export interface LoginRequest {
  tenantCode: string;
  email: string;
  password: string;
}

/**
 * No refresh token: Task 3 deliberately deferred them, so the access token is all
 * there is. On 401 the user re-authenticates.
 */
export interface LoginResponse {
  accessToken: string;
  /** Seconds until expiry. */
  expiresIn: number;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

export interface Tenant {
  id: TenantId;
  name: string;
  /** Stable short identifier, submitted at login to resolve tenant context. */
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
  /** Composed by the API. Use this for display rather than joining the parts here. */
  fullName: string;
  nationalId: string | null;
  nationalIdVerified: boolean;
  nationalIdVerifiedAt: IsoDateTime | null;
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
  /** Everything posted to the account, including funds pledged as collateral. */
  balance: Amount;
  /** Pledged against a loan and therefore not withdrawable. */
  heldAmount: Amount;
  /** `balance - heldAmount`. Show this, not `balance`, wherever a teller acts on it. */
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
  /** Account balance immediately after this posting. */
  balanceAfter: Amount;
  reference: string | null;
  narration: string | null;
  /** `null` for system-generated postings such as interest or fees. */
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
  /** Annual percentage rate — a rate, not money, so a number is correct here. */
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
//
// The API returns the resource itself — there is no `{ success, data }` envelope.
// Lists carry a count because pagination needs one; that's the only wrapper.
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/**
 * The only error shape the API returns. `message` is an array when validation
 * rejects several fields at once — render it accordingly, and never show the raw
 * object to a user.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}
