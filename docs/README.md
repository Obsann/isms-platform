# docs/

Specs, runbooks, the OpenAPI document, and recorded team decisions live here.

Expected contents as the project progresses:

| File / folder | Owner | Task |
|---|---|---|
| `openapi/` — API spec, including the mobile money C2B/B2C webhook and USSD session contracts | Liya | 26 |
| `rbac-matrix.md` — role-to-endpoint permission matrix the `@Roles(...)` guard is built against | Obsan | 22 |
| `test-case-matrix.md` — every functional requirement traced to a test case | Melkamu + Biruk | 30 |
| `deployment-runbook.md` — Postgres provisioning, API deploy, frontend deploy, credential rotation | Obsan | 32 |
| `manuals/` — admin manual and per-portal end-user manuals | whole team, compiled by Liya | 34 |

Nothing in here is generated. If a decision was made in a meeting and code depends
on it, write it down here rather than leaving it in chat.
