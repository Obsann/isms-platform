/**
 * Shared contracts (Task 5 — Obsan + Melkamu).
 *
 * This file and `frontend/src/types/index.ts` are mirrors of each other. Change one,
 * change the other in the same commit — that is the whole point of the file.
 *
 * These are **API shapes**, not database rows. An entity is what a table stores; a
 * contract here is what crosses the wire. They are deliberately allowed to differ —
 * `Member.fullName` and `Account.availableBalance` are computed by the API and exist
 * in no column anywhere.
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
 * Postgres stores money as `numeric(18,2)` and `pg` hands it back as a string
 * precisely because binary floating point cannot represent cents exactly. Parsing an
 * `Amount` into a `number` anywhere reintroduces the drift the schema exists to
 * prevent, and the ledger (Task 13) rejects any posting whose debits and credits
 * differ by any amount at all. Format for display with the shared helper in
 * `frontend/src/components/format.ts`; do arithmetic on the server, in the ledger.
 */
export type Amount = string;

/** ISO-4217, e.g. `"ETB"`. Stored as `char(3)`, defaulting to ETB. */
export type CurrencyCode = string;

/** Calendar date with no time component, `YYYY-MM-DD`. */
export type IsoDate = string;

/** Full ISO-8601 timestamp with offset. */
export type IsoDateTime = string;

// ---------------------------------------------------------------------------
// Status unions — canonical definitions
//
// Each of these is the single source of truth; the entities import from here rather
// than declaring their own copy, so a value added to a CHECK constraint can't drift
// away from the type the API promises.
// ---------------------------------------------------------------------------

export type TenantStatus = 'provisioning' | 'active' | 'suspended';
export type MemberStatus = 'pending' | 'active' | 'inactive';
/** Manual ID capture only — no live verification (DECISIONS.md D1). */
export type IdType = 'national_id' | 'passport' | 'other';
export type AccountType = 'savings' | 'share';
export type AccountStatus = 'active' | 'dormant' | 'closed';

/** No table yet — the ledger owns this from Task 13. */
export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'fee'
  | 'share-purchase'
  | 'loan-disbursement'
  | 'loan-repayment';

/** No table yet — Loans owns this from Task 16. */
export type LoanStatus =
  | 'draft'
  | 'pending-approval'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'repaying'
  | 'closed'
  | 'defaulted';

// ---------------------------------------------------------------------------
// Roles and portals
//
// A role is *not* a portal. `role` is the authorization identity stored on
// `staff_accounts` and checked by `@Roles(...)`; a portal is which UI shell someone
// lands in. They happen to look similar today, but a tenant that adds a loan officer
// gets a distinct role that still lands in the tenant-admin portal — so the mapping
// is explicit rather than assumed to be an identity function.
// ---------------------------------------------------------------------------

export type PortalName = 'super-admin' | 'tenant-admin' | 'teller' | 'member';

/** TODO(Task 22 — Obsan): extend from the RBAC matrix as it's written. */
export type RoleName = 'super-admin' | 'tenant-admin' | 'teller' | 'loan-officer' | 'member';

/** Which portal each role lands in after login (Task 4's redirect table). */
export const ROLE_PORTAL: Readonly<Record<RoleName, PortalName>> = {
  'super-admin': 'super-admin',
  'tenant-admin': 'tenant-admin',
  'loan-officer': 'tenant-admin',
  teller: 'teller',
  member: 'member',
};

/**
 * Reserved `LoginRequest.tenantCode` for platform super-admin. Not a real tenant —
 * login uses `resolve_platform_staff_by_email` instead of tenant RLS.
 */
export const PLATFORM_TENANT_CODE = 'platform';

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
 * `tenantCode` is required. `staff_accounts` is fail-closed under RLS, so there is no
 * "find the user, then infer their tenant" path — the tenant has to be resolved before
 * the credential lookup can see any row at all.
 *
 * Use `PLATFORM_TENANT_CODE` (`"platform"`) for the seeded platform super-admin.
 */
export interface LoginRequest {
  tenantCode: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  /** Seconds until expiry, derived from the token's own claims. */
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
  /**
   * Composed by the API, stored nowhere. Every portal needs a display name and none
   * of them should be re-implementing the join — particularly since `middleName` is
   * nullable and naive concatenation produces a double space.
   */
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
  /** Everything posted to the account, including funds pledged as collateral. */
  balance: Amount;
  /** Pledged against a loan and therefore not withdrawable. */
  heldAmount: Amount;
  /** `balance - heldAmount`, computed server-side. The only figure a withdrawal may draw against. */
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
  /** Account balance immediately after this posting — read off the ledger, not recomputed. */
  balanceAfter: Amount;
  /** Teller-supplied; also the idempotency anchor for offline sync (Task 15). */
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
// Responses are the resource itself — there is no `{ success, data }` envelope, and
// adding one later means touching every endpoint in six verticals. Lists carry a
// count because pagination needs one; that's the only wrapper.
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/**
 * The only error shape the API returns, produced by `AllExceptionsFilter`.
 * `message` is an array when validation rejects several fields at once.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}
