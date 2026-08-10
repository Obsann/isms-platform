# docs/

Specs, runbooks, the OpenAPI document, and recorded team decisions live here.

## Start here (everyone)

| File | What it is |
|---|---|
| [`TASKS.md`](./TASKS.md) | Master build order — every task, owner, dependency, verify step |
| [`TEAM_ASSIGNMENTS.md`](./TEAM_ASSIGNMENTS.md) | Same plan organized by person / vertical |
| [`CONVENTIONS.md`](./CONVENTIONS.md) | Coding conventions (module boundaries, ledger, RLS, naming) |
| [`GIT_WORKFLOW.md`](./GIT_WORKFLOW.md) | Branching, PR review, merge order |
| [`TEAM_STATUS.md`](./TEAM_STATUS.md) | Who is on what right now, blockers |
| [`DECISIONS.md`](./DECISIONS.md) | Recorded MVP decisions (scope changes, CoA, eligibility, seed) |

**Agent rules (Cursor / Antigravity):** also committed under
[`.cursor/rules/`](../.cursor/rules/) as `.mdc` files. After `git pull`, those
IDEs pick them up automatically — no copy-paste needed.

## Expected later

| File / folder | Owner | Task |
|---|---|---|
| `openapi/` — API spec, including mobile money C2B/B2C webhook contracts (no USSD) | Liya | 26 |
| `rbac-matrix.md` — role-to-endpoint permission matrix the `@Roles(...)` guard is built against (staff roles only; no USSD/Fayda system actors) | Obsan | 22 |
| `test-case-matrix.md` — every functional requirement traced to a test case (use `DECISIONS.md` for MVP FR deltas) | Melkamu + Biruk | 30 |
| `deployment-runbook.md` — Postgres provisioning, API deploy, frontend deploy, credential rotation | Obsan | 32 |
| `manuals/` — admin manual and per-portal end-user manuals | whole team, compiled by Liya | 34 |

Nothing in here is generated. If a decision was made in a meeting and code depends
on it, write it down here rather than leaving it in chat.
