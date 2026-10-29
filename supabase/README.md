# Xedruo central identity database

The Supabase Auth user UUID (`auth.users.id`) is the canonical Xedruo identity. Auth continues to own email addresses and credentials; the public tables below contain no password or email copy.

## Tables

- `xedruo_accounts`: one row per Auth user, keyed by `id` referencing `auth.users.id`; holds active/suspended status and account timestamps.
- `profiles`: shared editable profile data, keyed by the same Auth UUID; currently full name, avatar reference, biography, and timestamps.
- `xedruo_user_roles`: elevated roles keyed by `(user_id, role)`; `user_id` references `xedruo_accounts.id`. Each user can hold one staff position and may also hold `admin`.

The Auth trigger creates account and profile rows at signup. The migration backfills existing Auth users and preserves existing profile values. Existing profile roles recognized by the migration are copied into `xedruo_user_roles`.

## Permissions and account operations

RLS restricts authenticated reads to the caller's own account, profile, and roles. Profile updates are limited to the caller's own `full_name`, `avatar_url`, and `bio`, and are blocked for suspended accounts. Clients have no account-status or role write access. Role and account-status changes are exposed only through security-definer functions executable by the trusted `service_role` or the database owner:

```sql
select public.xedruo_set_user_role('AUTH_USER_UUID'::uuid, 'governor', true);
select public.xedruo_set_user_role('AUTH_USER_UUID'::uuid, 'governor', false);
select public.xedruo_set_account_status('AUTH_USER_UUID'::uuid, 'suspended');
```

Invoke these only from a trusted server using a server-only service credential, or from the Supabase SQL editor as the database owner. Never expose a service credential in frontend code. A suspended status is central account metadata; it does not revoke already-issued Auth tokens, so every service must check status when authorizing requests.

For a separate service database, store the canonical UUID in that service's own `user_id` column; independent databases cannot share a foreign key. Validate each incoming access token against the central Supabase Auth project (for example, with `supabase.auth.getUser(token)` on a trusted server) and derive the user UUID from the verified token's `sub` claim. Never trust a client-supplied UUID by itself.

## Migration workflow

`migrations/` is the canonical, ordered schema history. `../supabase/staff_roles.sql` is a legacy ad-hoc script, not a CLI migration; do not apply it separately. Install the Supabase CLI, start the local stack, and validate locally:

```bash
supabase start
supabase db lint --local
supabase migration list --local
```

Before any remote change, inspect the linked project's history and the proposed plan:

```bash
supabase migration list --linked
supabase db push --dry-run
```

Only after reviewing the plan and confirming the linked project, explicitly apply pending migrations:

```bash
supabase db push
```

Do not use a database reset to apply this schema. Apply the migration before deploying frontend code that queries these central tables.
