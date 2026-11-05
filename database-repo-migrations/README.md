# Migrations to apply from the xedruo-Database repo

Copy these two files into `olowolafedare/xedruo-Database/supabase/migrations/` and apply them there
(or paste them into the Supabase SQL Editor, in filename order). They are intentionally NOT in
`supabase/migrations/` of this repo: never run `supabase db push` from the platform repo.

1. 20261105000000_company_registry_callbacks.sql
2. 20261105010000_auth_throttle.sql
