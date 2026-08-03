# frontend/

Placeholder. The Next.js app is scaffolded in **Task 6 — Melkamu**, in this folder,
in this repo. Don't scaffold a separate copy elsewhere.

Task 6 sets up Next.js (App Router, TypeScript) with:

- `src/app/` route groups for the four portals — `(super-admin)`, `(tenant-admin)`,
  `(teller)`, `(member)` — each with a placeholder page
- `src/components/` — shared UI, the only cross-portal import source
- `src/types/` — the mirror of `backend/src/types` agreed in Task 5
- `src/lib/api-client/` — the single path every backend call goes through

Two rules from `.cursor/rules/conventions.mdc` that shape this folder from the first
commit:

- Portal route groups never import from each other. Promote the shared piece to
  `src/components/` instead.
- `.env` here is gitignored and holds no provider keys. Fayda and SMTP credentials
  live in `backend/` only.
