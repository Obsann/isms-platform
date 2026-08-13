# Team status board

Obsan maintains this. Update it when a PR opens, merges, or a teammate starts a
new task. Branch names must match `task<N>-<owner>-<short-desc>` from
[`.cursor/rules/git-workflow.mdc`](../.cursor/rules/git-workflow.mdc).

**How to refresh:** `git fetch --prune`, then check `git branch -r` and open PRs
against the table below. Statuses: `blocked` · `ready` · `in progress` · `in review` · `merged` · `not started` · `cancelled` · `reverted`.

Last refreshed: 2026-08-11 (`main` @ `f838782`). Scope: Fayda + USSD still out of
MVP — see [`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) D1.

**On `main`:** Tasks 1–3, 5, 6, 8 + docs (Fayda/USSD drop). **Not on `main`:**
Tasks 7, 10, 11, 12 (see notes below).

---

## Current snapshot

| Owner | Vertical | Current / next task | Expected branch | Status | Depends on |
|---|---|---|---|---|---|
| **Obsan** | Platform | Task 4 blocked / Task 22 ready | `task4-obsan-login-routing` | waiting on Task 7 back on `main` | Task 3 ✅, Task 7 |
| **Melkamu** | Member Management | Re-land Task 10 (then Task 11) | `task10-melkamu-member-ui` | **reverted** — work on branch, not on `main` | Tasks 8 ✅, 7 |
| **Jerry** | Transactions / Teller | Task 12 — Savings & Shares backend | `task12-jerry-savings` | **in progress** (1 commit ahead, ~17 behind `main`) | Tasks 1–5 ✅ |
| **Abenezer** | Loans & Credit | Task 16 — Loan backend | `task16-abenezer-loans` | blocked | Obsan's Task 13 |
| **Biruk** | Admin & Reporting | Task 19 — Super Admin console | `task19-biruk-super-admin` | blocked | Tasks 7, 4 |
| **Liya** | Member Self-Service | Re-land Task 7 design system | `task7-liya-design-system-shared-UI-kit` | **reverted off `main`** — branch exists, behind `main` | Melkamu's Task 6 ✅ |

**Active work:** Jerry coding Task 12 (not merged). Melkamu and Liya have
substantial branch work that briefly landed then came off `main` via reverts.

**Highest-leverage next steps:**
1. Re-merge Task 7 cleanly onto `main` (unblocks Obsan 4, Melkamu 10, Jerry 14, Biruk 19/21, Abenezer 18).
2. Merge Jerry Task 12 (unblocks Obsan 13 → Abenezer 16).
3. Re-land Melkamu Tasks 10 → 11 after Task 7 is stable on `main`.

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
- **2026-08-11 revert note.** PR #16 (Task 10) and PR #17 (Task 11) merged, then
  both were reverted (`f838782`, `33ae82e`). Task 7's design-system files had
  entered `main` via the Task 10 merge path and were removed with the Task 10
  revert. Re-land Task 7 as its own PR before re-opening 10/11.

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
| 4 Login & role routing | `task4-obsan-login-routing` | blocked | waiting on Task 7 stably on `main` |
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
| 10 Member UI | `task10-melkamu-member-ui` | **reverted** | PR #16 merged then reverted; branch tip still has the work. Re-open after Task 7 is on `main` alone |
| 11 Legacy onboarding | `task11-melkamu-legacy-import` | **reverted** | PR #17 merged then reverted; branch tip still has the work. Re-land after Task 10 |
| 30 Test matrix / UAT | — | later | with Biruk; trace FRs via .cursor/rules/decisions.mdc |

## Jerry — Transactions / Teller Desk

| Task | Branch | Status | Notes |
|---|---|---|---|
| 12 Savings & Shares backend | `task12-jerry-savings` | **in progress** | Not on `main`. ~17 commits behind — rebase/merge `main` before PR. Eligibility uses `availableBalance` (D3); release rules in D4 |
| 14 Teller Desk UI | `task14-jerry-teller-desk` | blocked | Tasks 12, 7 |
| 29 Offline outbox test | — | later | with Obsan |

## Abenezer — Loans & Credit

| Task | Branch | Status | Notes |
|---|---|---|---|
| 16 Loan backend | `task16-abenezer-loans` | blocked | Obsan Task 13 first — **no branch yet** |
| 17 Guarantor / collateral | `task17-abenezer-guarantors` | blocked | Owns hold release on repay (D4) |
| 18 Loan UI | `task18-abenezer-loan-ui` | blocked | Tasks 16, 7 |
| 31 Bug triage | — | later | Week 5 |

## Biruk — Admin & Reporting

| Task | Branch | Status | Notes |
|---|---|---|---|
| 19 Super Admin console | `task19-biruk-super-admin` | blocked | Tasks 7, 4 — **no branch yet** |
| 20 Documents & Reporting | `task20-biruk-reporting` | blocked | Tasks 12, 13, 16 |
| 21 Tenant Admin dashboard | `task21-biruk-tenant-admin` | blocked | Tasks 19, 20, 7 |
| 30 Test case matrix / UAT | — | later | with Melkamu |

## Liya — Member Self-Service

| Task | Branch | Status | Notes |
|---|---|---|---|
| 7 Design system | `task7-liya-design-system-shared-UI-kit` | **reverted off `main`** | Implemented and briefly on `main` via Task 10 path; removed by Task 10 revert. Re-merge as its own PR — **highest-leverage gate** |
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
| **Task 7 (re-land)** | Task 4, 10, 14, 18, 19, 21, 24 |
| Task 12 | Obsan Task 13 |
| Task 13 ledger | Jerry Task 14, Abenezer Task 16 |
| Task 14 online Teller | Obsan Task 15 |
| Task 22 RBAC guards | each vertical applying `@Roles(...)` |

---

## Remote branches (raw)

As of last refresh (`main` @ `f838782`):

- `origin/main` — Tasks 1, 2, 3, 5, 6, 8 + docs; Task 10/11 merges reverted
- `origin/task7-liya-design-system-shared-UI-kit` — Task 7 work (behind `main`; needs clean re-land)
- `origin/task10-melkamu-member-ui` — Task 10 work (reverted from `main`)
- `origin/task11-melkamu-legacy-import` — Task 11 work (reverted from `main`)
- `origin/task12-jerry-savings` — active (Jerry; rebase onto latest `main` before merge)
- Stale after merge: `task1`…`task8`, older `docs-obsan-*` — delete when convenient
- Still no branches from Abenezer or Biruk
