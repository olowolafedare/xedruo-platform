# AGENTS.md

## Project context

This is the Xedruo Group Holdings platform. The application is maintained in GitHub, deployed by Vercel, and uses the shared Xedruo Supabase project. Do not use the legacy Base44 CLI/SDK for new work; the base44 folder is reference-only.

## Backend: Supabase

- Auth: Supabase Auth with Google OAuth/PKCE and the supported email/phone flows.
- Accounts: `public.xedruo_accounts` and `public.xedruo_profiles`, keyed by the Supabase Auth user UUID.
- Staff roles: `public.xedruo_account_roles` joined to `public.xedruo_roles`; never read roles from user-editable metadata.
- Shared identity: `public.xedruo_identity`, issued only through `ensure_xedruo_identity`; do not generate IDs in browser code.
- Company app profiles: `public.xedruo_company_profiles`, created through `ensure_xedruo_company_profile`.
- Country/phone: `public.xedruo_country_calling_codes` and the `set_xedruo_identity_phone` RPC.
- Core records: `public.xedruo_records`, protected by owner-scoped RLS.
- API: Supabase Edge Function `xedruo-core-api` backs `xedruo.entities.*`.
- Storage: Supabase Storage (`xedruo-media` bucket).
- Enforce authorization through RLS and trusted server-side checks. Never expose service-role or VAPID private keys.

## Key files

- `src/api/xedruoClient.js`: Supabase client and Xedruo API wrapper.
- `src/lib/AuthContext.jsx`: global authentication state.
- `src/lib/xedruoIdentity.js`: central identity and company-profile RPC helpers.
- `src/pages/IdentityOnboarding.jsx`: country, phone and identity onboarding.
- `src/components/IdentityGate.jsx`: protects management routes until country and phone are saved.
- `src/pages/ParentLogin.jsx`, `src/pages/ParentCompany.jsx`: internal management portal.

## Database changes

The shared database source of truth is the separate `olowolafedare/xedruo-Database` repository. Do not run a blind `supabase db push` from this application repository. Review and apply shared migrations from the database repository, then update application code.

## Development

- Use `npm run dev`, `npm run lint`, and `npm run build`.
- Staff roles include governor, ceo, cfo, developer, customer_service and operations.
- Preserve existing Auth users and account data. Do not remove legacy records without a verified migration and backup.
