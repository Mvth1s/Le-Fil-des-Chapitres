-- Privileges of the application roles on the public schema.
--
-- Why: least privilege. Three roles share the database:
--   * the owner ("_owner") owns the schema and the tables, runs migrations
--     (DDL) through `node ace migration:run --connection=migration`;
--   * app_role ("_app") is used by the running backend: read and write rows
--     only, no CREATE / ALTER / DROP;
--   * ro_role ("_ro") is read only (inspection, exports, debugging).
--
-- How: run with psql, connected AS THE OWNER, passing the role names as
-- psql variables (role names only, never a password):
--   psql -v ON_ERROR_STOP=1 -v app_role=<app role> -v ro_role=<ro role> -f grants.sql
--
-- When to replay it (the script is idempotent, GRANT is a no-op when the
-- privilege already exists):
--   * local init and CI, after the roles and the database are created;
--   * in production, after each migration (the ALL TABLES grants only cover
--     tables that exist at execution time);
--   * after any revalidation of the rights in the alwaysdata interface,
--     which may reset the privileges set here.
--
-- This script creates no role and sets no password: roles are managed
-- outside of the repository.

GRANT USAGE ON SCHEMA public TO :"app_role", :"ro_role";

-- Existing tables and sequences.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"app_role";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"ro_role";

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_role";
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO :"ro_role";

-- Future tables and sequences created by the owner (the role running this
-- script, so FOR ROLE is implicit), e.g. by upcoming migrations.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_role";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO :"ro_role";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :"app_role";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON SEQUENCES TO :"ro_role";
