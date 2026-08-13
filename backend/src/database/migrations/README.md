# Migrations

Generated TypeORM migrations live in this folder. `data-source.ts` one level up is
the single source of connection config for both the CLI and the app.

```bash
# generate from the current entity definitions (Task 2 onward)
npm run migration:generate -- src/database/migrations/InitialSchema

# apply / roll back
npm run migration:run
npm run migration:revert
```

Rules from [`.cursor/rules/conventions.mdc`](../../../../.cursor/rules/conventions.mdc)
and [`.cursor/rules/git-workflow.mdc`](../../../../.cursor/rules/git-workflow.mdc):

- Pull `main` and regenerate against it before starting any schema change.
- Every non-platform-global table carries an indexed `tenant_id`.
- Never edit a migration that has been merged or applied — add a new one on top.
- Never resolve a migration conflict by hand-merging. Drop yours, re-pull `main`,
  regenerate.
- No migration or seed script writes a balance directly. Balances move only through
  the ledger service's posting function (Task 13).
