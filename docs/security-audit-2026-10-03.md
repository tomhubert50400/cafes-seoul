# Security audit changes (2026-10-03)

These are reviewable source changes. **No production database migration, environment change or deployment has been performed.**

## Database review and rollout

Run `npm run test:security` for the isolated PostgreSQL/PGlite regression fixtures. These cover ordinary profile edits, rejected role escalation and privileged inserts, allowed trusted-server updates, and caller-scoped RPC access. The fixtures do not replace a full Supabase migration replay or staging auth/RLS tests.

Review and apply additive migrations only after a staging backup and schema review. The profile trigger is deliberately SECURITY INVOKER: requests under anon/authenticated cannot alter privileged columns; trusted service-role and existing SECURITY DEFINER operations retain their privileges. Admin users may still edit ordinary profile fields; role/billing/account-deletion changes must use trusted server operations. No client-side admin role-management UI is introduced.

For rollback, preserve the original migration history and use a reviewed forward migration. Do not blindly remove the profile trigger, caller checks or EXECUTE restrictions, because that would reopen the reported access paths. If a trusted operational flow needs an exception, test it on staging and implement a narrowly authorized server-side operation rather than reopening direct profile writes.

The original 3102 owner-policy definition is moved to 3103 for fresh databases (its referenced cafe_owners table does not exist until 3103). Already-applied migrations are not meant to be rerun. 3109 protects privileged profile fields; 3110 replaces the preferences RPC with owner authorization, fixed search path, current table/column references and restricted execute grants. The preferences fixture tests a legitimate user result as well as unauthorized callers.
