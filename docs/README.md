# docs/

Team process and background specs live here. **Agent-enforced rules** live only
under [`.cursor/rules/`](../.cursor/rules/) — no duplicate copies in this folder.

## Classification

### Cursor rules (`.cursor/rules/`) — agents load these

| Rule | Mode | What it is |
|---|---|---|
| [`conventions.mdc`](../.cursor/rules/conventions.mdc) | always + `backend/**`, `frontend/**` | Module boundaries, ledger, RLS, naming, secrets |
| [`decisions.mdc`](../.cursor/rules/decisions.mdc) | always | MVP decisions (no Fayda/USSD, CoA, eligibility, seed, tests) |
| [`docs-map.mdc`](../.cursor/rules/docs-map.mdc) | always | This classification — where to read what |
| [`git-workflow.mdc`](../.cursor/rules/git-workflow.mdc) | on request | Branching, PR review, merge order |
| [`task-plan.mdc`](../.cursor/rules/task-plan.mdc) | on request | Pointer into TASKS / assignments / status |

### Docs only (`docs/`) — humans + read on demand

| File | What it is |
|---|---|
| [`TASKS.md`](./TASKS.md) | Master build order — every task, owner, dependency, verify step |
| [`TEAM_ASSIGNMENTS.md`](./TEAM_ASSIGNMENTS.md) | Same plan organized by person / vertical |
| [`TEAM_STATUS.md`](./TEAM_STATUS.md) | Who is on what right now, blockers |
| [`SACCO_PROPOSAL.md`](./SACCO_PROPOSAL.md) | Background SDS — **not** MVP truth; prefer `decisions.mdc` |
| [`test-case-matrix.md`](./test-case-matrix.md) | Task 30 — FR → test case, UAT script, sign-off, defects (Melkamu + Biruk) |
| [`backup-disaster-recovery.md`](./backup-disaster-recovery.md) | Task 33 — backup schedule, restore rehearsal, RLS re-check (Melkamu) |
| [`backup-rehearsal-log.md`](./backup-rehearsal-log.md) | Task 33 — recorded dump/restore/RLS pass |
| [`README.md`](./README.md) | This index |

## Expected later (docs only until written)

| File / folder | Owner | Task |
|---|---|---|
| `openapi/` — API spec, including mobile money C2B/B2C webhook contracts (no USSD) | Liya | 26 |
| `rbac-matrix.md` — role-to-endpoint permission matrix | Obsan | 22 |
| ~~`test-case-matrix.md`~~ — written: [`test-case-matrix.md`](./test-case-matrix.md) | Melkamu + Biruk | 30 |
| `deployment-runbook.md` | Obsan | 32 |
| ~~`backup-disaster-recovery.md`~~ — written: [`backup-disaster-recovery.md`](./backup-disaster-recovery.md) | Melkamu | 33 |
| `manuals/` — admin + portal manuals | whole team, compiled by Liya | 34 |

Nothing in here is generated. If a decision was made in a meeting and code depends
on it, record it in `.cursor/rules/decisions.mdc`.
