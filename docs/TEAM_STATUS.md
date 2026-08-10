# Team status board

Obsan maintains this. Update it when a PR opens, merges, or a teammate starts a
new task. Branch names must match `task<N>-<owner>-<short-desc>` from
`.cursor/rules/git-workflow.mdc` (also `docs/GIT_WORKFLOW.md`).

**How to refresh:** `git fetch --prune`, then check `git branch -r` and open PRs
against the table below. Statuses: `blocked` · `ready` · `in progress` · `in review` · `merged` · `not started`.

Last refreshed: 2026-08-06 (Melkamu Task 8 in progress). Tasks 1–3, 5, 6 + shared docs/rules on `main` (through PR #10).

---

## Current snapshot

| Owner | Vertical | Current / next task | Expected branch | Status | Depends on |
|---|---|---|---|---|---|
| **Obsan** | Platform | Task 4 blocked / Task 22 ready | `task4-obsan-login-routing` | waiting on Liya Task 7 | Task 3 ✅ |
| **Melkamu** | Member Management | Task 8 — Member API | `task8-melkamu-member-api` | **in progress** (branch pushed ~14h ago) | Tasks 1–5 ✅ |
| **Jerry** | Transactions / Teller | Task 12 — Savings & Shares backend | `task12-jerry-savings-shares` | **ready, not started** | Tasks 1–5 ✅ |
| **Abenezer** | Loans & Credit | Task 16 — Loan backend | `task16-abenezer-loans` | blocked | Obsan's Task 13 |
| **Biruk** | Admin & Reporting | Task 19 — Super Admin console | `task19-biruk-super-admin` | blocked | Tasks 7, 4 |
| **Liya** | Member Self-Service | Task 7 — Design system | `task7-liya-design-system` | **ready, not started — idle since 2026-08-04** | Melkamu's Task 6 ✅ |

**Active work:** Melkamu is coding Task 8 (create/search/get/patch members via
`TenantContextService.repo` — looks correctly scoped). Still waiting on Jerry
Task 12 and Liya Task 7.

### Week 0 still open

| Item | Owner | Status |
|---|---|---|
| Docker Compose Postgres (everyone runs the same `postgres:16`) | Obsan | **shipped with Task 2** — note: default password changed from `devpassword` to a new value post-merge; everyone must re-pull `main`, update `backend/.env`, and run `docker compose down -v && docker compose up -d` |
| Local Postgres confirmed by each person | everyone | Obsan confirmed; others still pending Docker Desktop setup |
| Fayda sandbox verification call | Melkamu | not started (must land before Task 9) |

### Process notes

- **Resolved.** Task 6 originally landed directly on `main`; Melkamu later followed the branch model correctly on `task6-melkamu-gitignore` (PR #8).
- **`docs/TEAM_STATUS.md` is Obsan's to edit.** Flag status changes rather than editing from feature branches.
- **Task 5 (PR #9)** landed the shared contracts. Melkamu should still read the five decisions in the PR body (money as string, fullName composition, role≠portal, expiresIn seconds, no envelope) before writing Task 8 logic against them — especially the `api-client` changes.

---

## What Task 3 changes for everyone (read before Tasks 8, 12, 16, 23)

Full detail in `backend/README.md`.

1. **Every route needs a Bearer token** unless marked `@Public()` (health + login only).
2. **Tenant-scoped tables go through `TenantContextService.repo(Entity)`**, never plain `@InjectRepository` — otherwise RLS returns zero rows with no error.
3. **Don't hand-write `WHERE tenant_id = ?`.** The guard sets the RLS session variable.
4. **Login takes `{ tenantCode, email, password }`.**
5. **`npm run seed`** creates two dev tenants for local auth/isolation checks.

Migrations: `DB_USERNAME=postgres`. Running API / RLS checks: `DB_USERNAME=isms_app`.

---

## What Task 5 changed (shared contracts)

Mirrored in `backend/src/types` and `frontend/src/types`:

- Money is `Amount` (decimal **string**). Format with `formatCurrency` — never `parseFloat`.
- `Member` has name parts + API-composed `fullName`.
- `RoleName` ≠ `PortalName`; use `ROLE_PORTAL` for redirects.
- Login returns `{ accessToken, expiresIn: number, user }` — no refresh token, no `{ success, data }` envelope.
- Lists are `{ items, total }`. Errors are `{ statusCode, message, error }`.

`Transaction` and `Loan` shapes are provisional until Tasks 12 and 16 land tables.

---

## Obsan — Platform

| Task | Branch | Status | Notes |
|---|---|---|---|
| 1 Backend scaffold | `task1-obsan-backend-scaffold` | **merged** (PR #1) | on `main` |
| 2 Database schema v1 | `task2-obsan-database-schema-v1` | **merged** (PR #2, #4) | Verified end-to-end against real Postgres |
| 3 Auth & tenant-context | `task3-obsan-auth-tenant-context` | **merged** (PR #7) | RLS bootstrap fix + JWT login + tenant context pipeline |
| 4 Login & role routing | `task4-obsan-login-routing` | blocked | Task 3 ✅ — waiting only on Liya's Task 7 |
| 5 Shared types | `task5-obsan-melkamu-shared-types` | **merged** (PR #9) | Unblocks Melkamu Task 8 and Jerry Task 12 |
| 13 Ledger engine | `task13-obsan-ledger` | blocked | after Jerry Task 12 |
| 15 Offline-sync | `task15-obsan-offline-sync` | blocked | after Jerry Task 14 |
| 22 Security & Audit / RBAC | `task22-obsan-rbac-audit` | **ready** | Task 3 ✅. Needs an RBAC matrix in `docs/` before the guard is meaningful |
| 27–29, 32–33, 35 | — | later | Week 5–6 |

## Melkamu — Member Management

| Task | Branch | Status | Notes |
|---|---|---|---|
| 5 Shared types | `task5-obsan-melkamu-shared-types` | **merged** (PR #9) | Read PR #9 decisions before Task 8 |
| 6 Frontend scaffold | `task6-melkamu-gitignore` | **merged** (PR #8 + earlier scaffold commits) | |
| 8 Member API | `task8-melkamu-member-api` | **in progress** | Branch pushed (`2110473`). DTOs + controller + service; uses `TenantContextService`. Open a PR when ready for review. |
| 9 Fayda verification | `task9-melkamu-fayda` | blocked | Week 0 sandbox call first |
| 10 Member UI | `task10-melkamu-member-ui` | blocked | Tasks 8, 9, 7 |
| 11 Legacy onboarding | `task11-melkamu-legacy-import` | blocked | Task 8 |
| 30 Test matrix / UAT | — | later | with Biruk |

## Jerry — Transactions / Teller Desk

| Task | Branch | Status | Notes |
|---|---|---|---|
| 12 Savings & Shares backend | `task12-jerry-savings-shares` | **ready, not started** | Task 5 ✅ — no branch yet. Use `Amount` string + `TenantContextService.repo()` |
| 14 Teller Desk UI | `task14-jerry-teller-desk` | blocked | Tasks 12, 7 |
| 29 Offline outbox test | — | later | with Obsan |

## Abenezer — Loans & Credit

| Task | Branch | Status | Notes |
|---|---|---|---|
| 16 Loan backend | `task16-abenezer-loans` | blocked | Obsan Task 13 first |
| 17 Guarantor / collateral | `task17-abenezer-guarantors` | blocked | Task 16 |
| 18 Loan UI | `task18-abenezer-loan-ui` | blocked | Tasks 16, 7 |
| 31 Bug triage | — | later | Week 5 |

## Biruk — Admin & Reporting

| Task | Branch | Status | Notes |
|---|---|---|---|
| 19 Super Admin console | `task19-biruk-super-admin` | blocked | Tasks 7, 4 |
| 20 Documents & Reporting | `task20-biruk-reporting` | blocked | Tasks 12, 13, 16 |
| 21 Tenant Admin dashboard | `task21-biruk-tenant-admin` | blocked | Tasks 19, 20, 7 |
| 30 Test matrix / UAT | — | later | with Melkamu |

## Liya — Member Self-Service

| Task | Branch | Status | Notes |
|---|---|---|---|
| 7 Design system | `task7-liya-design-system` | **ready, not started** | Still the highest-leverage idle task — gates Task 4, 10, 19, 21, 24. No branch yet. |
| 23 Member self-service API | `task23-liya-member-api` | blocked | Tasks 12, 16 |
| 24 Member portal UI | `task24-liya-member-portal` | blocked | Tasks 23, 7 |
| 25 Notifications | `task25-liya-notifications` | blocked | Tasks 12, 16 |
| 26 Mobile money / USSD contracts | `task26-liya-channel-contracts` | blocked | Tasks 12, 16 |
| 34 Docs compilation | — | later | Week 6 |

---

## Merge-order watchlist (Obsan as reviewer)

Ping Obsan on any PR that touches ledger, auth/JWT, tenant-context/RLS, RBAC, or
shared platform migrations.

| Gate | Must merge before |
|---|---|
| Task 5 ✅ | anyone writing against shared types |
| Task 13 ledger | Jerry Task 14, Abenezer Task 16 |
| Task 14 online Teller | Obsan Task 15 |
| Task 22 RBAC guards | each vertical applying `@Roles(...)` |

---

## Remote branches (raw)

As of last refresh (`main` @ `5acc5f7`):

- `origin/main` — Tasks 1, 2, 3, 5, 6 + docs/rules share (PR #10)
- `origin/task8-melkamu-member-api` — active (Melkamu)
- Stale after merge: `task1`…`task5`, `task6-melkamu-gitignore`, older `docs-obsan-*` branches — delete when convenient
- Still no branches from Jerry, Abenezer, Biruk, or Liya
