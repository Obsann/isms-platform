# Task 32 — Deployment runbook

**Owner:** Obsan  
**Verify:** someone other than Obsan can follow this document and get a working deployment
without a clarifying question.

This describes a typical internship MVP deployment: one Postgres instance, one NestJS API,
one Next.js frontend. Adjust hostnames and secrets for your environment.

---

## 1. Prerequisites

- Linux or Windows Server with Docker (or managed Postgres 16+)
- Node.js 20+ on the API and web build hosts (or build in CI and ship artifacts)
- TLS certificates for public HTTPS (reverse proxy)
- SMTP credentials in `backend/.env` if notifications must send (Task 25)

---

## 2. Secrets and rotation

1. Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env`.
2. Set strong values — never commit `.env`:

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | API auth signing key — rotate on go-live |
| `POSTGRES_PASSWORD` / `DB_PASSWORD` | Database |
| `SMTP_*` | Email notifications (backend only) |

3. Rotate all dev-seed passwords before production (`DevPassword!123` is for local seed only).
4. Frontend must only contain `NEXT_PUBLIC_API_BASE_URL` — no provider keys in `frontend/`.

---

## 3. Database (Postgres 16)

### Docker (matches local dev)

```bash
# repo root — creates isms-postgres + optional nightly backup sidecar
docker compose up -d postgres postgres-backup
```

### Migrations and seed

```bash
cd backend
npm install
# migrations as postgres superuser
DB_USERNAME=postgres npm run migration:run

# optional dev/demo seed — skip in real production or use a production seed script
DB_USERNAME=postgres npm run seed
```

The API runtime user should be `isms_app` (RLS-enforced), not `postgres`:

```env
DB_USERNAME=isms_app
DB_PASSWORD=<same as configured in docker/postgres/init/>
```

### Backup before go-live

See [`backup-disaster-recovery.md`](./backup-disaster-recovery.md). Run `npm run backup:rehearse`
and confirm `npm run rls:check` passes on the restored database.

---

## 4. NestJS API

```bash
cd backend
npm ci
npm run build
NODE_ENV=production npm run start:prod
```

Default listen: `PORT=4000`, prefix `API_PREFIX=api`.

Health check:

```bash
curl -fsS http://localhost:4000/api/health
```

### Production checklist

- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` set to the real frontend origin (no `*`)
- [ ] `DB_SSL=true` if Postgres requires TLS
- [ ] Process manager (systemd, PM2, or container) restarts on failure
- [ ] Logs aggregated (no secrets in log lines)

---

## 5. Next.js frontend

```bash
cd frontend
npm ci
# set NEXT_PUBLIC_API_BASE_URL=https://api.your-sacco.example/api
npm run build
npm run start
```

Default dev port `3000`. In production, serve behind nginx/Caddy with HTTPS.

---

## 6. Reverse proxy (example)

Point `https://app.example.com` → frontend (`3000`) and `https://api.example.com` → API (`4000`).
Ensure the browser sees a single trusted origin for cookies if you add them later; MVP uses
Bearer tokens in memory/local storage via the existing api-client.

---

## 7. Post-deploy verification

```bash
cd backend
npm run rls:check
powershell -ExecutionPolicy Bypass -File scripts/verify-rbac.ps1
```

Walk [`integration-pass.md`](./integration-pass.md) against the deployed URLs.

---

## 8. Rollback

1. Stop API containers/processes (no new writes).
2. Restore latest dump: `npm run backup:restore -- --file=backups/<timestamp>.dump --database=isms_dev`
   or restore to a spare DB and rehearse per `backup-disaster-recovery.md`.
3. Redeploy the previous API/frontend build artifacts.
4. Re-run `npm run rls:check` before reopening to staff.

---

## 9. Managed hosting (Vercel + Render)

Internship default when not using a VPS:

| Piece | Host | Root |
|---|---|---|
| Next.js | Vercel | `frontend/` |
| NestJS API | Render web service | `backend/` |
| Postgres 16 | Render PostgreSQL | Blueprint `isms-postgres` |

`render.yaml` at the repo root is the Blueprint. Pre-deploy runs `npm run release`: create `isms_app`, migrate as the Render owner, seed demo data.

Set `CORS_ORIGIN` to the Vercel origin (not `*`) and `NEXT_PUBLIC_API_URL` to `https://<api>.onrender.com/api`. Redeploy Vercel after the API URL is known.

Rotate `DevPassword!123` (dev seed) before any real users. SMTP stays unset until you add `SMTP_*` on the Render service. Do not commit `.env`.
