/**
 * Task 23 member self-service reads, used by the Task 24 portal.
 * Balance, statement, and loans are real API data — never mocked.
 */

import type { Account, IsoDateTime, Member, MemberId, PaginatedResult, Transaction } from '@/types';
import { apiClient, getSessionUser } from './index';

export interface MemberBalanceView {
  memberId: MemberId;
  memberNumber: string;
  fullName: string;
  accounts: Account[];
  asOf: IsoDateTime;
}

export interface MemberStatementView {
  memberId: MemberId;
  memberNumber: string;
  fullName: string;
  transactions: Transaction[];
  asOf: IsoDateTime;
}

export interface MemberLoanSummary {
  loanId: string;
  loanNumber: string;
  requestedAmount: string;
  approvedAmount: string | null;
  disbursedAmount: string | null;
  termMonths: number;
  purpose: string | null;
  status: string;
  appliedAt: IsoDateTime;
}

export interface MemberLoansView {
  memberId: MemberId;
  memberNumber: string;
  fullName: string;
  status: 'available' | 'dependency_unavailable';
  loans: MemberLoanSummary[];
}

export interface MemberStatementQuery {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export function getMemberBalance(memberId: string) {
  return apiClient.get<MemberBalanceView>(`/members/${encodeURIComponent(memberId)}/balance`);
}

export function getMemberStatement(memberId: string, query: MemberStatementQuery = {}) {
  const params = new URLSearchParams();
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiClient.get<MemberStatementView>(
    `/members/${encodeURIComponent(memberId)}/statement${qs ? `?${qs}` : ''}`,
  );
}

export function getMemberLoans(memberId: string) {
  return apiClient.get<MemberLoansView>(`/members/${encodeURIComponent(memberId)}/loans`);
}

/**
 * Staff JWT `id` is not the members table id. Match the signed-in email to a
 * member record in this tenant so the portal can call Task 23 routes.
 */
const LINKED_MEMBER_KEY = 'isms_linked_member';

function readCachedMember(email: string): Member | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LINKED_MEMBER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email: string; member: Member };
    if (parsed.email !== email) return null;
    return parsed.member;
  } catch {
    return null;
  }
}

function writeCachedMember(email: string, member: Member): void {
  sessionStorage.setItem(LINKED_MEMBER_KEY, JSON.stringify({ email, member }));
}

export async function findMemberForSession(): Promise<Member | null> {
  const user = getSessionUser();
  if (!user?.email) return null;
  const cached = readCachedMember(user.email);
  if (cached) return cached;
  const query = new URLSearchParams({ search: user.email, limit: '5' });
  const result = await apiClient.get<PaginatedResult<Member>>(`/members?${query.toString()}`);
  const email = user.email.trim().toLowerCase();
  const member = result.items.find((row) => (row.email ?? '').trim().toLowerCase() === email) ?? null;
  if (member) writeCachedMember(user.email, member);
  return member;
}
