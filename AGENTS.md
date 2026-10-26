# AGENTS.md

## Project Context

This is the Xedruo Group Holdings platform. It was originally generated on Base44 but has been **migrated to GitHub + Vercel + Supabase**. **Supabase is the backend** (Auth, Postgres, Storage, Edge Functions). Do not use the Base44 CLI/SDK for new work; the `base44/` folder is legacy reference only.

Start with `README.md` for local setup and environment variables.

## Backend: Supabase

- Auth: Supabase Auth (email/password, email OTP, phone OTP, Google OAuth with PKCE).
- Data: Supabase Postgres. Staff/user roles live in `public.profiles.role`.
- API: Supabase Edge Function `xedruo-core-api` (entity CRUD used by `xedruo.entities.*`).
- Storage: Supabase Storage (`xedruo-media` bucket).
- Authorization must be enforced with RLS / server-side checks. Never trust `user_metadata` for roles (users can edit it).

## Key Files

- `src/api/xedruoClient.js`: Supabase client and the `xedruo` API wrapper (auth, entities, uploads).
- `src/lib/AuthContext.jsx`: global auth state.
- `src/pages/ParentLogin.jsx`, `src/pages/ParentCompany.jsx`: staff/admin portal (`/parent-company`).
- `.env.local`: local-only values; never commit secrets.

## Working Notes

- Use `npm run dev` / `npm run build` / `npm run lint`.
- Staff roles: governor, ceo, cfo, developer, customer_service, operations.
- Keep changes focused and preserve existing conventions.
