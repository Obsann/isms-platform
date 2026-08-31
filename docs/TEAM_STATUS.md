# Team status board

Obsan maintains this. Update it when a PR opens, merges, or a teammate starts a
new task. Branch names must match `task<N>-<owner>-<short-desc>` from
[`.cursor/rules/git-workflow.mdc`](../.cursor/rules/git-workflow.mdc).

**How to refresh:** `git fetch --prune`, then check `git branch -r` and open PRs
against the table below. Statuses: `blocked` · `ready` · `in progress` · `in review` · `merged` · `not started` · `cancelled` · `reverted`.

Last refreshed: 2026-08-31 (`main` @ `ca56aa9`). Scope: Fayda + USSD still out of
MVP — see [`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) D1.

**On `main`:** Tasks 1–8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, **22**, 23, 24, 25, 26, 30
+ docs (Fayda/USSD drop, `rbac-matrix.md`, test-case matrix, MoMo OpenAPI).

**Not on `main`:** Tasks 20, 21, 33 (open branches), Task 18 follow-up commits (7 on branch).

**`main` builds.** Task 22 (PR #46) removed the broken `DocumentsReportingController`
registration from PR #33. Biruk restores the controller with Task 20.

---

## Current snapshot

| Owner | Vertical | Current / next task | Expected branch | Status | Depends on |
|---|---|---|---|---|---|
| **Obsan** | Platform | Tasks 27–29, 32, 35 closeout + Task 33 integration | `task28-32-obsan-platform-closeout` | **in progress** | Task 15 ✅ |
| **Melkamu** | Member Mgmt + 24 + 33 | Task 33 PR review; Task 30 staff UAT with Biruk | `task33-melkamu-backup-restore` | Task 33 **in review** (Obsan branch integrates scripts) | — |
| **Jerry** | Transactions / Teller | Task 29 verify with Obsan | — | Tasks 12, 14, 15 **merged** | — |
| **Abenezer** | Loans & Credit | Fix D-30-01, D-30-02; Task 31 defect list | `task18-abenezer-loan-ui` | 7 commits unmerged on branch | — |
| **Biruk** | Admin & Reporting | Merge Task 20 + 21 (remove mock data first) | `task20-biruk-reporting`, `task21-biruk-tenant-admin-dashboard` | **in progress** — branches open | — |
| **Liya** | Member Self-Service | Task 34 doc template; fix member `:id` ownership check | — | Tasks 7, 23, 25, 26 **merged** | — |

**Active gates:**
1. **Biruk merge Task 20** — reporting controller + real ledger reads (D-30-03, D-30-04).
2. **Biruk merge Task 21** — real tenant-admin dashboard (placeholder on `main` today).
3. **Obsan merge platform closeout** — Tasks 27, 28, 29, 32, 35 docs + Task 33 scripts on `docker-compose`.
4. **Everyone re-verify vertical** under enforced RBAC (Task 22 merged — see below).

### Week 0

| Item | Owner | Status |
|---|---|---|
| Docker Compose Postgres | Obsan | **shipped with Task 2** |
| Local Postgres confirmed by each person | everyone | Docker Compose path works; each person should confirm locally |
| Fayda sandbox verification call | Melkamu | **cancelled** (D1) |

### Process notes

- **Scope change 2026-08-10.** Live Fayda + all USSD out of MVP.
- **Task ownership (2026-08-29).** Melkamu owns Task 24 (member portal UI) and Task 33
  (backup/DR rehearsal) in addition to Member Management.
- **Task 22 merged (PR #46).** RBAC enforced globally; audit log live. Closes D-30-05, D-30-06.
- **Task 15 merged (PR #50).** Offline teller outbox + server idempotency.
- **No offline/demo fallbacks in merged code.** Strip "dev fallback" commits from open
  branches before merge — Task 27 requires real endpoints only.
- **Every PR must build** after merging `main`.

---

## Task 22 is on `main` — read this before your next PR

Full matrix: [`rbac-matrix.md`](./rbac-matrix.md).

1. **`RolesGuard` is global.** `@Roles(...)` on every authenticated route is enforced;
   missing decorator = 403 (fail closed).
2. **State-changing requests are audited** in `audit_logs` (same transaction as the
   business write). `GET /api/audit-logs` for tenant-admin and super-admin only.
3. **Re-verify your vertical** — check your rows in the matrix.
4. **Open gap (Liya):** member self-service routes allow role `member` but do not yet
   verify `:id` is the caller's own member record.

Live re-check scripts: `backend/scripts/verify-rbac.ps1`, `verify-audit-log.ps1`,
`verify-offline-outbox.ps1`.

---

## Obsan — Platform

| Task | Branch | Status | Notes |
|---|---|---|---|
| 1–5, 13 Backend + auth + ledger | various | **merged** | |
| 4 Login & role routing | `task4-obsan-login-routing` | **merged** (PR #22) | |
| 22 Security & Audit / RBAC | `task22-obsan-rbac-audit` | **merged** (PR #46) | RolesGuard, audit log, `rbac-matrix.md` |
| 15 Offline-sync | `task15-obsan-offline-sync` | **merged** (PR #50) | outbox + idempotency |
| 27 Integration pass | `task28-32-obsan-platform-closeout` | **in progress** | `integration-pass.md` |
| 28 RLS concurrent load | same | **in progress** | `npm run rls:check` |
| 29 Offline outbox edge cases | same | **in progress** | `verify-offline-outbox.ps1` |
| 32 Deployment runbook | same | **in progress** | `deployment-runbook.md` |
| 35 Final UAT sign-off | same | **in progress** | `uat-sign-off.md` template |
| 33 Backup & DR (scripts) | Melkamu branch + Obsan closeout | **in review** | credit Melkamu; Obsan wires compose + npm scripts |

## Melkamu — Member Management (+ Tasks 24, 33)

| Task | Branch | Status | Notes |
|---|---|---|---|
| 6, 8, 10, 11 | various | **merged** | PR #40, #41 |
| 24 Member portal UI | `task24-melkamu-member-portal-ui` | **merged** (PR #45) | |
| 30 Test matrix / UAT | — | **merged** (PR #44) | Staff UAT session with Biruk still to run |
| 33 Backup & DR rehearsal | `task33-melkamu-backup-restore` | **in review** | scripts integrated on Obsan closeout branch |
| 34 Docs — Member section | — | not started | Week 6 |

## Jerry — Transactions / Teller Desk

| Task | Branch | Status | Notes |
|---|---|---|---|
| 12 Savings & Shares backend | `task12-jerry-savings` | **merged** (PR #19) | |
| 14 Teller Desk UI | `task14-teller-desk-v2` | **merged** (PR #32) | |
| 29 Offline outbox test | — | **ready** | run with Obsan verify script |

## Abenezer — Loans & Credit

| Task | Branch | Status | Notes |
|---|---|---|---|
| 16 Loan backend | `task16-abenezer-loans` | **merged** (PR #27, #38) | |
| 17 Guarantor / collateral | `task17-abenezer-guarantors` | **merged** (PR #28) | |
| 18 Loan UI | `task18-abenezer-loan-ui` | **merged** (PR #31) | 7 follow-up commits on branch — strip demo fallbacks before re-merge |
| 31 Bug triage | — | **ready** | owns D-30-01 through D-30-04 in `test-case-matrix.md` |

## Biruk — Admin & Reporting

| Task | Branch | Status | Notes |
|---|---|---|---|
| 19 Super Admin console | `task19-biruk-super-admin` | **merged** (PR #33) | 2 follow-up commits on branch |
| 20 Documents & Reporting | `task20-biruk-reporting` | **in progress** | controller + real ledger reads — fixes D-30-03, D-30-04 |
| 21 Tenant Admin dashboard | `task21-biruk-tenant-admin-dashboard` | **in progress** | real dashboard on branch; `main` still placeholder |
| 30 Test case matrix / UAT | — | **merged** (PR #44) | staff UAT with Melkamu |

## Liya — Member Self-Service

| Task | Branch | Status | Notes |
|---|---|---|---|
| 7 Design system | `task7-liya-clean-portal-shells` | **merged** (PR #29) | |
| 23 Member self-service API | `task23-liya-member-api` | **merged** (PR #30, #43) | |
| 25 Notifications | `task25-liya-notifications` | **merged** (PR #36) | |
| 26 Mobile money webhook contracts | `task26-liya-momo-webhooks` | **merged** (PR #37) | |
| 34 Docs compilation | — | **ready** | set template + deadline for team |

---

## Merge-order watchlist (Obsan as reviewer)

| Gate | Must merge before |
|---|---|
| Task 20 | reporting endpoints; D-30-03, D-30-04 |
| Task 21 | real tenant-admin dashboard |
| Obsan closeout PR | Week 5–6 platform sign-off docs |
| Melkamu Task 33 | can close when Obsan closeout merges (scripts credited to Melkamu) |

---

## Remote branches (raw)

As of 2026-08-31 (`main` @ `ca56aa9`):

- `origin/main` — through Task 15 (PR #50); **builds**
- `origin/task20-biruk-reporting` — Task 20
- `origin/task21-biruk-tenant-admin-dashboard` — Task 21
- `origin/task33-melkamu-backup-restore` — Task 33 (11 commits)
- `origin/task18-abenezer-loan-ui` — 7 follow-up commits (demo fallbacks — strip before merge)
- `origin/task19-biruk-super-admin` — 2 follow-up commits
- Local: `task28-32-obsan-platform-closeout` — not yet pushed
