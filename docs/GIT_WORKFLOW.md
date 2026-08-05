# ISMS — Git Workflow

Human-readable copy of the branching and review rules. **Cursor / Antigravity
agents also load** [`.cursor/rules/git-workflow.mdc`](../.cursor/rules/git-workflow.mdc)
when relevant. Prefer editing the `.mdc` file when changing a rule, then keep
this file in sync.

## Repo
- `isms-platform`, one monorepo: `backend/` (NestJS), `frontend/` (Next.js),
  `docs/`. Conventions live in `.cursor/rules/conventions.mdc` (and
  [`docs/CONVENTIONS.md`](./CONVENTIONS.md)).
- Obsan scaffolds Task 1 and pushes the initial repo; Melkamu scaffolds Task 6
  on top in the same repo. Everyone else clones — nobody scaffolds their own copy.

## Branch model
- Trunk-based, short-lived branches, PRs into `main` — no direct pushes.
- Branch name: `task<N>-<owner>-<short-desc>`.
- One branch per task. Don't carry multiple tasks on one branch.

## Standard flow
```
git checkout main
git pull
git checkout -b task<N>-<yourname>-<short-desc>
# ...do the work, run the task's verify step...
git add <only files inside your owning vertical/module>
git commit -m "Task <N>: <what you did>"
git push -u origin task<N>-<yourname>-<short-desc>
# open PR into main, request review per table below
# once approved:
git checkout main
git pull
git merge task<N>-<yourname>-<short-desc>
git push
git branch -d task<N>-<yourname>-<short-desc>
```

## Review requirements
| Area | Reviewer required |
|---|---|
| Ledger, auth/JWT, tenant-context/RLS, RBAC framework, migrations to shared platform tables | **Obsan** |
| Your own vertical's backend/frontend code | **Any other vertical owner** |
| Anything touching `shared-types`/DTOs (Task 5) | **Owner of the vertical consuming the changed type** |

If a PR spans more than one area, get both reviews.

## Merge order — dependency rules
- **Task 5** (shared types, Obsan + Melkamu): done live together, one merge, not
  two parallel branches.
- **Task 12→13** (Jerry's savings → Obsan's ledger): Obsan merges ledger before
  Jerry branches Task 14.
- **Task 14→15** (Jerry's Teller UI → Obsan's offline-sync): Obsan doesn't start
  Task 15 until Jerry's Task 14 online-only version is merged.
- **Task 13→16** (Obsan's ledger → Abenezer's Loans): Obsan merges Task 13 first;
  Abenezer branches Task 16 off updated `main`.
- **Task 12,13,16 → Task 20,23** (Biruk, Liya read-only deps): pull `main` right
  before branching.
- **Task 22** (Obsan's RBAC guards): merges first; each vertical owner pulls
  `main` and applies the decorator as part of their own task's verify step.

**Rule of thumb:** if your task depends on someone else's output, pull `main`
right before you branch — don't branch early and hope.

## Migrations
- Pull `main` and regenerate fresh before starting any schema-changing task —
  never generate against a schema you haven't just synced.
- Read-only tasks (Task 20, 23, most reporting/self-service) shouldn't need a
  new migration — if you're writing one, check with Obsan first.
- Never edit a migration already merged/applied — add a new one on top.

## Merge conflicts
1. Don't guess — ping the other file owner first.
2. Conflicts in `ledger`, `auth`/`tenant-context`, `shared-types` are serious —
   a wrong resolution breaks something silently.
3. When unsure, favor `main`'s version and re-apply your change on top, rather
   than trusting an auto-resolution blind.
4. Migration conflicts: don't hand-merge files — drop yours, re-pull `main`,
   regenerate fresh.

## Before every PR
- [ ] Still passes the task's verify step on `main`'s latest state, not just
      your branch
- [ ] Nothing touched outside your owning vertical/folder
- [ ] `.env` still gitignored, both `backend/` and `frontend/`
- [ ] New/changed table → migration regenerated against freshly-pulled `main`
- [ ] Touches a shared platform file (ledger/auth/RLS/RBAC) → Obsan tagged as
      reviewer

## End of project
Once Week 6 UAT sign-off is locked and the deployment runbook rehearsed once
against `main`, stop merging non-essential changes.
