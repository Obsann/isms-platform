# Team status board

Obsan maintains this. Update it when a PR opens, merges, or a teammate starts a
new task. Branch names must match `task<N>-<owner>-<short-desc>` from
`.cursor/rules/git-workflow (1).mdc`.

**How to refresh:** `git fetch --prune`, then check `git branch -r` and open PRs
against the table below. Statuses: `blocked` · `ready` · `in progress` · `in review` · `merged` · `not started`.

Last refreshed: 2026-08-05 (after Task 2 + Task 6 merged).

---

## Current snapshot

| Owner | Vertical | Current / next task | Expected branch | Status | Depends on |
|---|---|---|---|---|---|
| **Obsan** | Platform | Task 3 — Auth & tenant-context | `task3-obsan-auth-tenant-context` | not started | Task 2 ✅ |
| **Melkamu** | Member Management | Task 8 — Member API | `task8-melkamu-member-api` | blocked | Tasks 1–5 (Task 6 ✅, Task 5 still open) |
| **Jerry** | Transactions / Teller | Task 12 — Savings & Shares backend | `task12-jerry-savings-shares` | blocked | Tasks 1–5 |
| **Abenezer** | Loans & Credit | Task 16 — Loan backend | `task16-abenezer-loans` | blocked | Obsan's Task 13 |
| **Biruk** | Admin & Reporting | Task 19 — Super Admin console | `task19-biruk-super-admin` | blocked | Tasks 7, 4 |
| **Liya** | Member Self-Service | Task 7 — Design system | `task7-liya-design-system` | ready | Melkamu's Task 6 ✅ |

### Week 0 still open

| Item | Owner | Status |
|---|---|---|
| Docker Compose Postgres (everyone runs the same `postgres:16`) | Obsan | **shipped with Task 2** — note: default password changed from `devpassword` to a new value post-merge; everyone must re-pull `main`, update `backend/.env`, and run `docker compose down -v && docker compose up -d` |
| Local Postgres confirmed by each person | everyone | Obsan confirmed; others still pending Docker Desktop setup |
| Fayda sandbox verification call | Melkamu | not started (must land before Task 9) |

### Open process note

- Task 6 (Melkamu) landed on `main` as commits `51b6b58` / `711aaa5` with no visible `task6-melkamu-frontend-scaffold` branch and no PR merge commit — commit messages also don't follow the `Task <N>: <what you did>` convention. Content itself is clean (portal groups, shared `api-client`, no secrets), but worth confirming with Melkamu whether this went through review per the branch-model rule ("no direct pushes").

---

## Obsan — Platform

| Task | Branch | Status | Notes |
|---|---|---|---|
| 1 Backend scaffold | `task1-obsan-backend-scaffold` | **merged** (PR #1) | on `main` |
| 2 Database schema v1 | `task2-obsan-database-schema-v1` | **merged** (PR #2, #4) | Verified end-to-end against real Postgres (migration up/down, RLS tenant isolation, API boot-gating on DB) |
| 3 Auth & tenant-context | `task3-obsan-auth-tenant-context` | not started | after Task 2 ✅ — next up |
| 4 Login & role routing | `task4-obsan-login-routing` | not started | needs Task 3 + Liya Task 7 |
| 5 Shared types | (live with Melkamu — one branch) | not started | not two parallel branches |
| 13 Ledger engine | `task13-obsan-ledger` | blocked | after Jerry Task 12 |
| 15 Offline-sync | `task15-obsan-offline-sync` | blocked | after Jerry Task 14 |
| 22 Security & Audit / RBAC | `task22-obsan-rbac-audit` | blocked | after Task 3 |
| 27–29, 32–33, 35 | — | later | Week 5–6 |

## Melkamu — Member Management

| Task | Branch | Status | Notes |
|---|---|---|---|
| 5 Shared types | (live with Obsan) | not started | |
| 6 Frontend scaffold | — | **merged** (commits `51b6b58`, `711aaa5`) | landed on `main` without a matching branch/PR — confirm review happened |
| 8 Member API | `task8-melkamu-member-api` | blocked | Tasks 1–5 |
| 9 Fayda verification | `task9-melkamu-fayda` | blocked | Week 0 sandbox call first |
| 10 Member UI | `task10-melkamu-member-ui` | blocked | Tasks 8, 9, 7 |
| 11 Legacy onboarding | `task11-melkamu-legacy-import` | blocked | Task 8 |
| 30 Test matrix / UAT | — | later | with Biruk |

## Jerry — Transactions / Teller Desk

| Task | Branch | Status | Notes |
|---|---|---|---|
| 12 Savings & Shares backend | `task12-jerry-savings-shares` | blocked | Tasks 1–5 |
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
| 7 Design system | `task7-liya-design-system` | blocked | Melkamu Task 6 |
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

- `origin/main` — Tasks 1, 2, 6 merged (through commit `8e62316`)
- `origin/task1-obsan-backend-scaffold` — stale after merge; delete when convenient
- `origin/task2-obsan-database-schema-v1` — stale after merge; delete when convenient
- `origin/docs-obsan-team-status` — stale after merge; delete when convenient
- No branches yet from Jerry, Abenezer, Biruk, or Liya
