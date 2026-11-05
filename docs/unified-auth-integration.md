# Xedruo unified auth — platform gateway + shared client

Customer sign-in finishes on each product's own origin. The platform only identifies the user,
collects country / phone / legal name once, and answers "granted" for that company.

| Folder | Goes in repo | What it is |
|---|---|---|
| `database/` | `xedruo-Database` | Migrations: per-company callback allowlists; server-only login throttle |
| `gateway/index.ts` | platform repo → `supabase/functions/xedruo-auth-gateway/` | Edge Function (registry, identity, onboarding, session validate) |
| `auth-client/` | publish as `@xedruo/auth-client` (or copy into each product) | Shared client used by every product |
| `examples/` | reference only | Callback + onboarding screens for a Vite/React product |

## Flow
product login → (Google PKCE → product `/auth/callback`) or password → `POST /session/validate`
→ `onboarding_required` → product's own onboarding form → `POST /identity/onboarding` → `granted` → product dashboard.

## What the gateway enforces
- Company is bound server-side: `X-Xedruo-Company` slug must exist in the registry **and** its `app_origin` must equal the request `Origin`.
- CORS is returned only for verified company origins (and is not treated as authorization — the JWT is).
- JWT is validated with Supabase Auth on every call; suspended accounts are refused.
- Country is permanent once the Xedruo ID is issued (409 on change). Phone is E.164. No SMS verification required.
- No tokens in URLs. The gateway never returns tokens and never redirects.
- Generic credential errors; small per-isolate rate limit on authenticated routes; structured audit log lines.
- Xedruo ID login: durable DB throttle (5 failures/15 min per ID, 20 per IP), identical errors and timing for unknown IDs, suspended accounts never get a session, session returned in the response body only.

## Assumptions to confirm (I could not see the live database)
1. Registry columns are `company_slug`, `display_name`, `enabled`, `app_origin` (edit `REG` in `index.ts` and the SQL if not).
2. `ensure_xedruo_identity`, `complete_xedruo_identity_onboarding` and `ensure_xedruo_company_profile` use `auth.uid()` (the gateway calls them with the user's JWT, not the service role).
3. `xedruo_accounts` rows are created by the signup trigger.

## Rollout (pilot one company first)
1. Review/apply the migration in `xedruo-Database`; add the same callback URLs in Supabase → Auth → URL Configuration.
2. Add to platform `supabase/config.toml`:
   ```
   [functions.xedruo-auth-gateway]
   verify_jwt = false
   ```
   then `supabase functions deploy xedruo-auth-gateway`.
3. In the pilot product (suggest Healthruo or Music): install the client, add `/login`, `/auth/callback`, `/onboarding` using `examples/`.
4. Test end to end: Google, email/password, new user (onboarding), returning user, suspended user, wrong origin (must 403).
5. Migrate remaining products; then retire the platform's customer `/login`, `/register`, `/auth/callback`, `companyHandoff.js` and phone-OTP login.

## Xedruo ID + password login
`auth.signInWithXedruoId(id, password)` → `POST /auth/v1/id/login` → session in the response body → stored in the product's own storage → `/session/validate`.
- Apply **both** migrations (`..._callbacks.sql`, `..._auth_throttle.sql`) before deploying; the endpoint fails closed (500) if the throttle functions are missing.
- Accounts created with Google only have no password. They can set one through the existing password-reset flow, or keep using Google.
- Show the user their Xedruo ID after onboarding (`access.identity.xedruo_id`); that is the only time they otherwise learn it.
- **Supabase Auth rate limits:** GoTrue sees the Edge Function's IP, not the customer's, so its per-IP sign-in limit is shared by all ID logins. Raise "Rate limit for sign-ups and sign-ins" in Auth → Rate Limits and watch for 429s.
- ASSUMPTION: Xedruo IDs match `^[A-Z0-9-]{6,32}$` (edit `ID_RE` if the issued format differs) and are stored in `xedruo_identity.xedruo_id` exactly as typed after uppercase/space-stripping.

## Not included yet
- Country list endpoint (products currently ship their own list).
- An audit table (currently structured console logs).
- Server-to-server calls (e.g. Next.js server routes): the gateway requires a browser `Origin`; those need a separate keyed path.
- Not tested against a live Supabase project: no network access here.
