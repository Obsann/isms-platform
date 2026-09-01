# frontend/

ISMS web app — Next.js (App Router) + TypeScript. Four portal route groups share
one codebase.

Read [`.cursor/rules/conventions.mdc`](../.cursor/rules/conventions.mdc) and
[`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) before adding
pages. Cursor applies conventions to everything under `frontend/`.

## Local setup

```bash
# from repo root — API + Postgres must be up for real calls
docker compose up -d
cd backend && npm run start:dev

# in another terminal
cd frontend
npm install
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API default:
`http://localhost:4000/api` via `NEXT_PUBLIC_API_URL`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server (port 3000) |
| `npm run build` | production build |
| `npm run start` | serve the production build |
| `npm run lint` | ESLint |

## Layout

```
src/
├── app/
│   ├── (super-admin)/     Super Admin portal — Biruk
│   ├── (tenant-admin)/    Tenant Admin portal — Biruk / Melkamu screens
│   ├── (teller)/          Teller Desk — Jerry / Abenezer loan screens
│   └── (member)/          Member self-service — Liya
├── components/            Shared UI used by every portal
│   └── ui/
├── lib/api-client/        ONLY place that calls the backend
└── types/                 shared contracts — mirror of backend/src/types
```

## Frontend rules, in short

- A portal imports `@/components`, `@/lib/api-client`, `@/types`, and its own
  route group — **never** another portal’s files. Promote shared pieces to
  `components/`.
- No scattered `fetch()` in components — extend `lib/api-client`.
- Money is an `Amount` string; render with `formatCurrency` as full figures
  (`45,230.00 ETB`), never `45.2K`, never `parseFloat`.
- Errors: surface API `message` or a generic fallback — never raw objects/stacks.
- MVP: no Fayda verify UI, no USSD; mobile money UI is mocked/labeled only
  (see decisions D1).
- Client route guards (Task 4) are UX only — the backend still enforces access.

## Portals

| Route group | URL prefix | Owner (UI) |
|---|---|---|
| `(super-admin)` | `/super-admin/...` | Biruk |
| `(tenant-admin)` | `/tenant-admin/...` | Biruk + Melkamu |
| `(teller)` | `/teller/...` | Jerry + Abenezer |
| `(member)` | `/member/...` | Liya |

Sign in at `/login`. Seeded accounts (password `DevPassword!123`):

| tenantCode | email | lands on |
|---|---|---|
| `platform` | `superadmin@platform.dev` | Super Admin |
| `tenant-a` | `admin@tenant-a.dev` | Tenant Admin |
| `tenant-a` | `loan-officer@tenant-a.dev` | Tenant Admin |
| `tenant-a` | `teller@tenant-a.dev` | Teller |
| `tenant-a` | `abebe.bikila@tenant-a.dev` | Member |

A logged-in role cannot open another portal; `/` redirects to login or that role's home.

## Scope notes

Portals call the live API. Mobile money in the member portal is labeled mock-only
(decision D1) — it does not post to the ledger.
