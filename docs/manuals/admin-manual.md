# Platform / Super Admin manual

## What this portal is

The Super Admin portal is **platform-level**. Actions here create or suspend whole
SACCO tenants. They are not scoped by row-level security the way teller and tenant
admin requests are. The UI flags this.

## Sign in

1. Open the web app and go to Login.
2. Tenant code: `platform`
3. Email: `superadmin@platform.dev`
4. Password: the shared dev password in `docs/manuals/README.md` (local seed only)

You land on `/super-admin/dashboard`.

After `npm run seed`, the tenants list shows **Tsehay Sacco** (`tenant-a`) and
**Chereka Sacco** (`tenant-b`) — those are display names from the API. Login still
uses the codes. Super Admin (`platform`) is unchanged.

## Provision a tenant

1. Open **Tenants** (`/super-admin/tenants`).
2. Use **Provision New Tenant**.
3. Set a unique tenant **code** (used at login) and name, plus the first admin email.
4. On success the tenant appears in the list. On failure the form shows the API
   `message` — do not ignore a red state.

## Day-to-day

- **Dashboard** shows tenant counts by status (active / provisioning / suspended).
- Suspend or delete only when you intend a platform action. Deleting a tenant is
  not a member-level operation.
- Super Admin does **not** post deposits or approve loans for a SACCO. Switch to a
  tenant staff login for that.

## Deploy and backup (operators)

Follow [`../deployment-runbook.md`](../deployment-runbook.md):

1. `docker compose up -d` for Postgres (and the nightly backup sidecar).
2. Run migrations as the `postgres` role, then run the API as `isms_app` so RLS applies.
3. Set `JWT_SECRET`, database passwords, and SMTP in `backend/.env` only.
4. Point `NEXT_PUBLIC_API_URL` at the public API origin.
5. After restore, run `cd backend && npm run rls:check`.

Backup rehearsal: [`../backup-disaster-recovery.md`](../backup-disaster-recovery.md).
The 31 Aug rehearsal passed RLS ([`../backup-rehearsal-log.md`](../backup-rehearsal-log.md)).
