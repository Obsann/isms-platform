# Team status board

Obsan maintains this. Update it when a PR opens, merges, or a teammate starts a
new task. Branch names must match `task<N>-<owner>-<short-desc>` from
[`.cursor/rules/git-workflow.mdc`](../.cursor/rules/git-workflow.mdc).

**How to refresh:** `git fetch --prune`, then check `git branch -r` and open PRs
against the table below. Statuses: `blocked` · `ready` · `in progress` · `in review` · `merged` · `not started` · `cancelled` · `reverted`.

Last refreshed: 2026-09-01. Scope: Fayda + USSD still out of MVP — see
[`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) D1.

**On `main`:** Tasks 1–8, 10–26, 30, 31, 33 + closeout docs (27/28/29/32/35 templates).

**In flight:** `task27-obsan-mvp-finish` — mounts reporting controller on live ledger
reads, finishes tenant-admin dashboard/reports, Task 34 manuals.

---

## Current snapshot

| Owner | Vertical | Current / next task | Expected branch | Status | Depends on |
|---|---|---|---|---|---|
| **Obsan** | Platform | Task 27 finish + manuals + verify scripts | `task27-obsan-mvp-finish` | **in progress** | Tasks 20–26 ✅ |
| **Melkamu** | Member Mgmt | Task 34 member-manual review | — | Tasks 6, 8, 10, 11, 24, 30, 33 **merged** | — |
| **Jerry** | Transactions / Teller | Re-run Task 29 with verify script | — | Tasks 12, 14, 15 **merged** | — |
| **Abenezer** | Loans & Credit | Task 31 closed (D-30-01…04 resolved) | — | Tasks 16–18, 31 **merged** | — |
| **Biruk** | Admin & Reporting | Reporting wired on closeout branch | `task27-obsan-mvp-finish` | Tasks 19–21 **merged**; controller now registered | — |
| **Liya** | Member Self-Service | Task 34 compile | — | Tasks 7, 23–26 **merged**; ownership check **merged** (PR #52) | — |

**Active gates:**
1. Merge `task27-obsan-mvp-finish`.
2. Task 32: someone other than Obsan follows `deployment-runbook.md` on a real host.
3. Task 35: remaining signatures after a browser walkthrough.

### Week 0

| Item | Owner | Status |
|---|---|---|
| Docker Compose Postgres | Obsan | **shipped with Task 2** |
| Local Postgres confirmed by each person | everyone | Docker Compose path works |
| Fayda sandbox verification call | Melkamu | **cancelled** (D1) |

### Process notes

- **Scope change 2026-08-10.** Live Fayda + all USSD out of MVP.
- **Task 22 merged (PR #46).** RBAC enforced globally; audit log live.
- **Task 15 merged (PR #50).** Offline teller outbox + server idempotency.
- **Task 33 merged (PR #53).** Backup sidecar + dump/restore rehearsal passed RLS.
- **No live mobile money.** Task 24 UI is mocked; Task 26 is OpenAPI only (D1).

---

## Task 22 is on `main`

Full matrix: [`rbac-matrix.md`](./rbac-matrix.md). Member self-service `:id` ownership
is enforced (PR #52).

Live re-check scripts: `backend/scripts/verify-rbac.ps1`, `verify-audit-log.ps1`,
`verify-offline-outbox.ps1`.

---

## Per-owner task table

| Owner | Merged | Remaining |
|---|---|---|
| Obsan | 1–5, 13, 15, 22, 27–29 docs, 32 docs, 33 scripts | Production deploy rehearsal by a second person; Task 35 signatures |
| Melkamu | 6, 8, 10, 11, 24, 30, 33 | Staff UAT session recording (matrix already PASS) |
| Jerry | 12, 14 | Confirm Task 29 teller UI conflict in the browser |
| Abenezer | 16, 17, 18, 31 | None for MVP code |
| Biruk | 19, 20, 21, 30 | None once reporting controller merge lands |
| Liya | 7, 23, 25, 26 | Compile Task 34 from `docs/manuals/` |
