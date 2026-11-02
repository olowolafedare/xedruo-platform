# Xedruo shared Supabase project

The shared Xedruo database is managed from the separate `olowolafedare/xedruo-Database` repository. This folder is historical application-repository documentation; do not treat its old ad-hoc scripts as the current schema source.

## Current live architecture

- `xedruo_accounts`: one row per Supabase Auth user UUID, with account status.
- `xedruo_profiles`: shared user profile data, keyed by Auth UUID.
- `xedruo_account_roles` + `xedruo_roles`: role assignments and role definitions.
- `xedruo_identity`: central country-prefixed Xedruo ID, country, phone and KYC state.
- `xedruo_company_profiles`: company-specific profile rows linked to the central Xedruo ID.
- `xedruo_company_app_registry`: enabled company application slugs and display names.
- `xedruo_country_calling_codes`: country-to-calling-code mapping used by the identity RPC.
- `xedruo_identity_event_outbox`: server-only identity events.
- `xedruo_push_subscriptions`: server-managed push subscription records.
- `xedruo_records`: owner-scoped generic records used by company workspaces and `xedruo-core-api`.
- `xedruo_phone_otp_challenges`: server-only phone push OTP challenge records.

## Identity contract

- Supabase Auth UUID is the stable account key.
- A Xedruo ID is created through `ensure_xedruo_identity(p_country_code)`; never generate it in frontend code.
- Country is selected at onboarding and is permanent for the issued ID.
- Phone numbers are stored in E.164 format through `set_xedruo_identity_phone(p_country_code, p_phone_e164)`, which validates the calling code.
- Google authentication remains the account sign-in. Phone collection is required for ecosystem onboarding; push OTP verification is available as a follow-up step.
- Company app profiles are created through `ensure_xedruo_company_profile(p_company_slug, p_display_name)`.

## Security model

RLS is enabled across application tables. User-owned tables must have owner-scoped policies. Server-only tables (identity event outbox, push subscriptions, OTP challenges, and Xedrion's private search/cache tables) intentionally have no browser policies and are accessed only by trusted service-role functions. Do not add permissive browser policies to those tables.

Supabase currently reports leaked-password protection as disabled. Enable it in Supabase Auth security settings before treating the security checklist as fully complete.

## Migration workflow

1. Create timestamped SQL migrations in `olowolafedare/xedruo-Database/supabase/migrations`.
2. Review schema, grants, RLS, indexes and application compatibility.
3. Apply the migration to the shared Supabase project.
4. Verify migration history and security/performance advisors.
5. Deploy affected application code after the database contract is ready.

Do not run a blind full-project `supabase db push` from this application repository because the shared project contains migrations owned by multiple Xedruo products.
