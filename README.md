# Xedruo Group Holdings

Independent 15-company platform migrated from Base44 to GitHub + Vercel + Supabase.

## Production

- Frontend: Vercel
- Source: GitHub
- Backend/Auth: Supabase
- Production URL: https://xedruo-platform.vercel.app

## Architecture

Xedruo Group Holdings is the parent company overseeing the 14 operating companies. Each company is designed for its own dashboard, access boundary, route, and future custom domain.

## Development

```bash
npm install
npm run dev
npm run build
```

## Authentication

Google OAuth is handled through Supabase Auth. Production redirect URLs must be registered in Supabase and Google Cloud before enabling the provider in production.

## Central user identity database

Supabase Auth owns credentials and email addresses. The ordered migrations in `supabase/migrations/` create:

- `xedruo_accounts`, keyed to `auth.users.id`, for account status and timestamps.
- `profiles`, keyed to the same UUID, for shared editable profile fields.
- `xedruo_user_roles`, for Xedruo administrator and staff roles.

An Auth trigger creates account and profile rows, and the migration backfills existing Auth users without replacing existing profile values. The shared UUID is `auth.users.id`; no passwords or email copies are stored in the public account tables. Each service should store this UUID as its own user reference, validate incoming access tokens with the central Supabase Auth project, and check central account status where access is granted. Separate service databases cannot enforce a cross-database foreign key.

Authenticated users can read their own account, profile, and roles, and update only their own name, avatar, and biography. Role assignment and account suspension are trusted server operations only. To grant or revoke access, invoke `xedruo_set_user_role(user_id, role, enabled)` from a trusted server using a server-only service credential, or as the database owner in the Supabase SQL editor. Valid roles are `admin`, `governor`, `ceo`, `cfo`, `developer`, `customer_service`, and `operations`; a user can hold one staff position and may also hold `admin`. For example, an authorized database operator can run:

```sql
select public.xedruo_set_user_role('AUTH_USER_UUID'::uuid, 'governor', true);
select public.xedruo_set_user_role('AUTH_USER_UUID'::uuid, 'governor', false);
select public.xedruo_set_account_status('AUTH_USER_UUID'::uuid, 'suspended');
```

Never put a service credential in frontend code. Account status is central metadata; services must enforce it when authorizing requests because changing the database status alone does not revoke already-issued Supabase Auth tokens.

### Migration workflow

Install the Supabase CLI and start the local stack to validate migrations before deploying:

```bash
supabase start
supabase db lint --local
supabase migration list --local
```

After reviewing the migration and confirming the linked Supabase project, inspect the remote plan and apply it explicitly:

```bash
supabase db push --dry-run
supabase db push
```

Do not use a database reset to apply these migrations. `supabase/.temp/` contains local CLI linkage metadata and is intentionally ignored by Git.
