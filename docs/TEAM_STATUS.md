# Team status board

Obsan maintains this. Update it when a PR opens, merges, or a teammate starts a
new task. Branch names must match `task<N>-<owner>-<short-desc>` from
`.cursor/rules/git-workflow (1).mdc`.

**How to refresh:** `git fetch --prune`, then check `git branch -r` and open PRs
against the table below. Statuses: `blocked` · `ready` · `in progress` · `in review` · `merged` · `not started`.

Last refreshed: 2026-08-05 (after Task 3 merged, PR #7). Tasks 1, 2, 3, 6 are on `main`.

---

## Current snapshot

| Owner | Vertical | Current / next task | Expected branch | Status | Depends on |
|---|---|---|---|---|---|
| **Obsan** | Platform | Task 5 — Shared types (live with Melkamu) | one shared branch | **ready — top priority** | Tasks 1–3 ✅ |
| **Melkamu** | Member Management | Task 5 — Shared types (live with Obsan), then Task 8 | one shared branch → `task8-melkamu-member-api` | **ready — top priority** | Tasks 1–3, 6 ✅ |
| **Jerry** | Transactions / Teller | Task 12 — Savings & Shares backend | `task12-jerry-savings-shares` | blocked | Task 5 only remaining |
| **Abenezer** | Loans & Credit | Task 16 — Loan backend | `task16-abenezer-loans` | blocked | Obsan's Task 13 |
| **Biruk** | Admin & Reporting | Task 19 — Super Admin console | `task19-biruk-super-admin` | blocked | Tasks 7, 4 |
| **Liya** | Member Self-Service | Task 7 — Design system | `task7-liya-design-system` | **ready, not started — unblocked since 2026-08-04** | Melkamu's Task 6 ✅ |

**Two things gate everything else right now:** Task 5 (shared types) blocks Melkamu's
Task 8 and Jerry's Task 12; Liya's Task 7 blocks Melkamu's Task 10, Biruk's Tasks 19
and 21, and Obsan's Task 4. Nothing else on the board moves until those two land.

### Week 0 still open

| Item | Owner | Status |
|---|---|---|
| Docker Compose Postgres (everyone runs the same `postgres:16`) | Obsan | **shipped with Task 2** — note: default password changed from `devpassword` to a new value post-merge; everyone must re-pull `main`, update `backend/.env`, and run `docker compose down -v && docker compose up -d` |
| Local Postgres confirmed by each person | everyone | Obsan confirmed; others still pending Docker Desktop setup |
| Fayda sandbox verification call | Melkamu | not started (must land before Task 9) |

### Process notes

- **Resolved.** Task 6 originally landed directly on `main` (commits `51b6b58` / `711aaa5`) with no branch, no PR, and non-conforming commit messages. Melkamu has since followed the branch model correctly on `task6-melkamu-gitignore` (PR #8) — proper branch name, `Task <N>: ...` commit message. Treating the original as a one-off, not a pattern.
- **Watch:** PR #8 was self-merged by its author. Trivial two-line `.gitignore` change so no harm done, but the branch model expects a second pair of eyes — worth holding to for anything touching code.
- **Branch off a freshly-pulled `main`.** Melkamu's first attempt at the Task 6 follow-up was based on a four-commit-stale `main` and would have rolled this board backwards on merge. Cheap to avoid, annoying to untangle.
- **`docs/TEAM_STATUS.md` is Obsan's to edit.** Parallel edits to it from feature branches guarantee conflicts — flag status changes to Obsan instead of editing directly.

---

## What Task 3 changes for everyone (read before Tasks 8, 12, 16, 23)

Task 3 is on `main`, and it changes the ground rules for every backend route and
every query against a tenant-scoped table. Full detail in `backend/README.md`.

1. **Every route now requires a valid Bearer token** unless it's marked `@Public()`.
   Only `GET /api/health` and `POST /api/auth/login` are public. If a new endpoint
   returns 401 in your tests, that's the global `JwtAuthGuard`, working as intended.
2. **Never use `@InjectRepository(Entity)` on a tenant-scoped table.** Go through
   `TenantContextService.repo(Entity)` or `.getManager()` instead. An injected
   repository uses a pool connection with no `app.tenant_id` set — under `FORCE ROW
   LEVEL SECURITY` that returns **zero rows and no error**, so getting this wrong
   fails silently and looks like a data bug. `TenantContextService` is `@Global()`,
   so just inject it; no module import needed.
3. **Don't hand-write `WHERE tenant_id = ?`.** The per-request transaction sets the
   RLS session variable; the database does the filtering. If you feel like you need
   a manual tenant filter, the guard isn't reaching that route — tell Obsan.
4. **Login takes a tenant code**: `POST /api/auth/login` with
   `{ tenantCode, email, password }`. This is required, not optional — `staff_accounts`
   is fail-closed under RLS, so there's no "find the user, then infer the tenant" path.
5. **`npm run seed`** creates two dev tenants with one staff account each, which is
   the fastest way to exercise anything auth-related locally.

Note for whoever runs migrations: use `DB_USERNAME=postgres` for `migration:run`, and
switch back to `isms_app` to run the API, or RLS won't actually be enforced and your
isolation tests will pass for the wrong reason.

---

## Obsan — Platform

| Task | Branch | Status | Notes |
|---|---|---|---|
| 1 Backend scaffold | `task1-obsan-backend-scaffold` | **merged** (PR #1) | on `main` |
| 2 Database schema v1 | `task2-obsan-database-schema-v1` | **merged** (PR #2, #4) | Verified end-to-end against real Postgres (migration up/down, RLS tenant isolation, API boot-gating on DB) |
| 3 Auth & tenant-context | `task3-obsan-auth-tenant-context` | **merged** (PR #7) | Fixed a real bootstrap deadlock in Task 2's RLS on `tenants` (new migration `TenantBootstrapLookup`). Verified against real Postgres as `isms_app` (not superuser): login for two seeded tenants, `GET /api/auth/me`, route protection, and a data-layer check proving a tenant-A-scoped connection gets zero rows for a tenant-B row queried by id with no tenant filter in the query — RLS itself blocks it, not app code. See "What Task 3 changes for everyone" below. |
| 4 Login & role routing | `task4-obsan-login-routing` | blocked | Task 3 ✅ — now waiting only on Liya's Task 7 |
| 5 Shared types | (live with Melkamu — one branch) | **ready — top priority** | one shared branch, not two parallel ones. Blocks Melkamu Task 8 and Jerry Task 12. |
| 13 Ledger engine | `task13-obsan-ledger` | blocked | after Jerry Task 12 |
| 15 Offline-sync | `task15-obsan-offline-sync` | blocked | after Jerry Task 14 |
| 22 Security & Audit / RBAC | `task22-obsan-rbac-audit` | **ready** | Task 3 ✅ unblocked it. `@Roles(...)` decorator and `staff_accounts`/`roles_permissions` tables already in place. |
| 27–29, 32–33, 35 | — | later | Week 5–6 |

## Melkamu — Member Management

| Task | Branch | Status | Notes |
|---|---|---|---|
| 5 Shared types | (live with Obsan) | **ready — top priority** | blocks own Task 8 and Jerry's Task 12 |
| 6 Frontend scaffold | `task6-melkamu-gitignore` | **merged** (commits `51b6b58`, `711aaa5`; follow-up PR #8) | Scaffold content clean — portal groups, shared `api-client`, no secrets. Original landed without a branch/PR; follow-up went through the branch model correctly. |
| 8 Member API | `task8-melkamu-member-api` | blocked | Task 5 only remaining — read "What Task 3 changes for everyone" first |
| 9 Fayda verification | `task9-melkamu-fayda` | blocked | Week 0 sandbox call first |
| 10 Member UI | `task10-melkamu-member-ui` | blocked | Tasks 8, 9, 7 |
| 11 Legacy onboarding | `task11-melkamu-legacy-import` | blocked | Task 8 |
| 30 Test matrix / UAT | — | later | with Biruk |

## Jerry — Transactions / Teller Desk

| Task | Branch | Status | Notes |
|---|---|---|---|
| 12 Savings & Shares backend | `task12-jerry-savings-shares` | blocked | Task 5 only remaining — read "What Task 3 changes for everyone" first |
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
| 7 Design system | `task7-liya-design-system` | **ready, not started** | Unblocked since Melkamu's Task 6 landed on 2026-08-04. Currently the single biggest blocker on the board — gates Melkamu Task 10, Biruk Tasks 19/21, Obsan Task 4, and Liya's own Task 24. |
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
| Task 5 (Obsan + Melkamu, live) | anyone writing against shared types |
| Task 13 ledger | Jerry Task 14, Abenezer Task 16 |
| Task 14 online Teller | Obsan Task 15 |
| Task 22 RBAC guards | each vertical applying `@Roles(...)` |

---

## Remote branches (raw)

Fill from `git branch -r` after fetch. As of last refresh:

- `origin/main` — Tasks 1, 2, 3, 6 merged (through commit `dfab173`)
- `origin/task1-obsan-backend-scaffold` — stale after merge; delete when convenient
- `origin/task2-obsan-database-schema-v1` — stale after merge; delete when convenient
- `origin/task3-obsan-auth-tenant-context` — stale after merge; delete when convenient
- `origin/task6-melkamu-gitignore` — stale after merge; delete when convenient
- `origin/docs-obsan-team-status`, `origin/docs-obsan-team-status-refresh` — stale after merge; delete when convenient
- Still no branches ever from Jerry, Abenezer, Biruk, or Liya — only Obsan and Melkamu have committed to this repo
