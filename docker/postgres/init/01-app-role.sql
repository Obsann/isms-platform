-- Runs once when the data volume is first created.
--
-- The default `postgres` role is a superuser and bypasses RLS unconditionally, which
-- makes every isolation test pass for the wrong reason. Day-to-day API work and Task 3's
-- verify step should connect as `isms_app`. Keep `postgres` for `migration:run` and admin.
--
-- Migrations create tables as `postgres`, so default privileges are granted FOR ROLE
-- postgres — objects created later inherit the grant automatically.

CREATE ROLE isms_app LOGIN PASSWORD 'abebebesobela' NOSUPERUSER NOBYPASSRLS;

GRANT CONNECT ON DATABASE isms_dev TO isms_app;
GRANT USAGE ON SCHEMA public TO isms_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO isms_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO isms_app;
