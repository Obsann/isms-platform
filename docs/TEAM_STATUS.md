# Team status board

Obsan maintains this. Update it when a PR opens, merges, or a teammate starts a
new task. Branch names must match `task<N>-<owner>-<short-desc>` from
[`.cursor/rules/git-workflow.mdc`](../.cursor/rules/git-workflow.mdc).

**How to refresh:** `git fetch --prune`, then check `git branch -r` and open PRs
against the table below. Statuses: `blocked` · `ready` · `in progress` · `in review` · `merged` · `not started` · `cancelled`.

Last refreshed: 2026-08-10 (scope change: Fayda + USSD dropped from MVP — see
[`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) D1). Tasks 1–3, 5, 6, 8 on `main`. Task 12 on
branch, not merged.

---

## Current snapshot

| Owner | Vertical | Current / next task | Expected branch | Status | Depends on |
|---|---|---|---|---|---|
| **Obsan** | Platform | Task 4 blocked / Task 22 ready | `task4-obsan-login-routing` | waiting on Liya Task 7 | Task 3 ✅ |
| **Melkamu** | Member Management | Task 10 ready once Task 7 lands (Task 9 cancelled) | `task10-melkamu-member-ui` | Task 8 ✅ merged | Tasks 8 ✅, 7 |
| **Jerry** | Transactions / Teller | Task 12 — Savings & Shares backend | `task12-jerry-savings` | **in progress** (branch pushed, not on main) | Tasks 1–5 ✅ |
| **Abenezer** | Loans & Credit | Task 16 — Loan backend | `task16-abenezer-loans` | blocked | Obsan's Task 13 |
| **Biruk** | Admin & Reporting | Task 19 — Super Admin console | `task19-biruk-super-admin` | blocked | Tasks 7, 4 |
| **Liya** | Member Self-Service | Task 7 — Design system | `task7-liya-design-system` | **ready, not started** | Melkamu's Task 6 ✅ |

**Active work:** Jerry coding Task 12 off `main`. Melkamu’s Task 8 is merged.
Still waiting on Liya Task 7 (gates Task 4, 10, 14, 19, 21, 24).

### Week 0

| Item | Owner | Status |
|---|---|---|
| Docker Compose Postgres | Obsan | **shipped with Task 2** |
| Local Postgres confirmed by each person | everyone | Obsan confirmed; others still pending Docker Desktop setup |
| Fayda sandbox verification call | Melkamu | **cancelled** ([`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) D1) |

### Process notes

- **Scope change 2026-08-10.** Live Fayda + all USSD out of MVP. Manual
  `nationalId` + `idType` only. Mobile money remains documented + mocked.
- **`docs/TEAM_STATUS.md` is Obsan's to edit.** Flag status changes rather than
  editing from feature branches.
- **Task 5 (PR #9)** shared contracts — Melkamu/Jerry: money as string, etc.
  Member ID fields updated again under D1 (drop verified*, add `idType`).

---

## What Task 3 changes for everyone (read before Tasks 8, 12, 16, 23)

Full detail in `backend/README.md`.

1. **Every route needs a Bearer token** unless marked `@Public()` (health + login only).
2. **Tenant-scoped tables go through `TenantContextService.repo(Entity)`**, never plain `@InjectRepository` — otherwise RLS returns zero rows with no error.
3. **Don't hand-write `WHERE tenant_id = ?`.** The guard sets the RLS session variable.
4. **Login takes `{ tenantCode, email, password }`.**
5. **`npm run seed`** creates two dev tenants plus multi-role staff (see D5).

Migrations: `DB_USERNAME=postgres`. Running API / RLS checks: `DB_USERNAME=isms_app`.

---

## What Task 5 changed (shared contracts)

Mirrored in `backend/src/types` and `frontend/src/types`:

- Money is `Amount` (decimal **string**). Format with `formatCurrency` — never `parseFloat`.
- `Member` has name parts + API-composed `fullName`, plus `nationalId` + `idType` (no live verification fields).
- `RoleName` ≠ `PortalName`; use `ROLE_PORTAL` for redirects.
- Login returns `{ accessToken, expiresIn: number, user }` — no refresh token, no `{ success, data }` envelope.
- Lists are `{ items, total }`. Errors are `{ statusCode, message, error }`.

`Transaction` and `Loan` shapes are provisional until Tasks 12 and 16 land tables.

---

## Obsan — Platform

| Task | Branch | Status | Notes |
|---|---|---|---|
| 1 Backend scaffold | `task1-obsan-backend-scaffold` | **merged** (PR #1) | on `main` |
| 2 Database schema v1 | `task2-obsan-database-schema-v1` | **merged** (PR #2, #4) | |
| 3 Auth & tenant-context | `task3-obsan-auth-tenant-context` | **merged** (PR #7) | |
| 4 Login & role routing | `task4-obsan-login-routing` | blocked | waiting on Liya's Task 7 |
| 5 Shared types | `task5-obsan-melkamu-shared-types` | **merged** (PR #9) | |
| 13 Ledger engine | `task13-obsan-ledger` | blocked | after Jerry Task 12 merges; CoA = hard-coded pairs (D2) |
| 15 Offline-sync | `task15-obsan-offline-sync` | blocked | after Jerry Task 14 |
| 22 Security & Audit / RBAC | `task22-obsan-rbac-audit` | **ready** | Write `docs/rbac-matrix.md` — no USSD/Fayda system roles (D1) |
| 27–29, 32–33, 35 | — | later | Week 5–6 |

## Melkamu — Member Management

| Task | Branch | Status | Notes |
|---|---|---|---|
| 5 Shared types | `task5-obsan-melkamu-shared-types` | **merged** (PR #9) | |
| 6 Frontend scaffold | `task6-melkamu-gitignore` | **merged** (PR #8 + earlier) | |
| 8 Member API | `task8-melkamu-member-api` | **merged** (PR #11) | |
| 9 Fayda verification | — | **cancelled** | D1 |
| 10 Member UI | `task10-melkamu-member-ui` | blocked on Task 7 | Deps: 8 ✅, 7 — no Fayda UI |
| 11 Legacy onboarding | `task11-melkamu-legacy-import` | blocked | Task 8 ✅ |
| 30 Test matrix / UAT | — | later | with Biruk; trace FRs via .cursor/rules/decisions.mdc |

## Jerry — Transactions / Teller Desk

| Task | Branch | Status | Notes |
|---|---|---|---|
| 12 Savings & Shares backend | `task12-jerry-savings` | **in progress** | Not on `main` yet. Eligibility should use `availableBalance` (D3); release rules in D4 |
| 14 Teller Desk UI | `task14-jerry-teller-desk` | blocked | Tasks 12, 7 |
| 29 Offline outbox test | — | later | with Obsan |

## Abenezer — Loans & Credit

| Task | Branch | Status | Notes |
|---|---|---|---|
| 16 Loan backend | `task16-abenezer-loans` | blocked | Obsan Task 13 first |
| 17 Guarantor / collateral | `task17-abenezer-guarantors` | blocked | Owns hold release on repay (D4) |
| 18 Loan UI | `task18-abenezer-loan-ui` | blocked | Tasks 16, 7 |
| 31 Bug triage | — | later | Week 5 |

## Biruk — Admin & Reporting

| Task | Branch | Status | Notes |
|---|---|---|---|
| 19 Super Admin console | `task19-biruk-super-admin` | blocked | Tasks 7, 4 |
| 20 Documents & Reporting | `task20-biruk-reporting` | blocked | Tasks 12, 13, 16 |
| 21 Tenant Admin dashboard | `task21-biruk-tenant-admin` | blocked | Tasks 19, 20, 7 |
| 30 Test case matrix / UAT | — | later | with Melkamu |

## Liya — Member Self-Service

| Task | Branch | Status | Notes |
|---|---|---|---|
| 7 Design system | `task7-liya-design-system` | **ready, not started** | Highest-leverage idle task |
| 23 Member self-service API | `task23-liya-member-api` | blocked | Tasks 12, 16 |
| 24 Member portal UI | `task24-liya-member-portal` | blocked | Web only; mocked MoMo stays |
| 25 Notifications | `task25-liya-notifications` | blocked | Tasks 12, 16 |
| 26 Mobile money webhook contracts | `task26-liya-channel-contracts` | blocked | MoMo OpenAPI only — no USSD |
| 34 Docs compilation | — | later | Week 6 |

---

## Merge-order watchlist (Obsan as reviewer)

| Gate | Must merge before |
|---|---|
| Task 5 ✅ | anyone writing against shared types |
| Task 12 | Obsan Task 13 |
| Task 13 ledger | Jerry Task 14, Abenezer Task 16 |
| Task 14 online Teller | Obsan Task 15 |
| Task 22 RBAC guards | each vertical applying `@Roles(...)` |

---

## Remote branches (raw)

As of last refresh (`main` @ `dec0dd3`):

- `origin/main` — Tasks 1, 2, 3, 5, 6, 8 + docs
- `origin/task12-jerry-savings` — active (Jerry)
- Stale after merge: `task1`…`task8`, older `docs-obsan-*` — delete when convenient
- Still no branches from Abenezer, Biruk, or Liya
