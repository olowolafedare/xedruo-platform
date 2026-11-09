# Neon-backed central Xedruo authentication

The central identity service is hosted by the Xedruo Platform Vercel project and stores identity/authentication data in the independent Neon project `solitary-grass-19539960`, database `xedruo_platform_db`.

Supabase Auth is not the target identity provider in this architecture. The existing Supabase project remains untouched during the transition and is retained only as the legacy source until user records and app integrations are migrated and verified.

## Production API routes

- `GET /api/auth/health` — verifies the central API can query Neon.
- `GET /api/auth/google/start?company_slug=...&callback_url=...&code_challenge=...&code_challenge_method=S256` — validates the registered company callback and starts Google OAuth.
- `GET /api/auth/google/callback` — central Google OAuth callback; validates state, nonce, token audience, issuer, expiry and verified email; returns a one-time code to the exact registered company callback.
- `POST /api/auth/google/exchange` — exchanges the one-time code using PKCE and establishes a company-scoped session.
- `GET /api/auth/session` — validates a short-lived Xedruo access token.
- `POST /api/auth/refresh` — rotates a company-scoped refresh token and issues a new short-lived access token.
- `POST /api/auth/logout` — revokes the current company-scoped session.
- `POST /api/auth/identity/onboarding` — requires a valid session and issues one random 10-digit Xedruo ID after country, E.164 phone and legal-name checks. Phone verification is intentionally not required at this stage.

## Required central Vercel environment variables

Already configured:
- `DATABASE_URL` — private Neon connection string.
- `XEDRUO_SESSION_SIGNING_SECRET` — server-side HMAC signing key.
- `XEDRUO_GOOGLE_REDIRECT_URI` — `https://xedruo.com/api/auth/google/callback`.

Still required from the account owner:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Keep all values server-side; never use a `VITE_` or `NEXT_PUBLIC_` prefix for these secrets.

## Google Cloud OAuth configuration

Add this exact Authorized redirect URI to the Google OAuth Web application client:

`https://xedruo.com/api/auth/google/callback`

Do not register each company callback with Google. Google returns to the central Xedruo callback; the central service then returns a short-lived, single-use authorization code to the exact company callback registered in Neon.

## Company callback allowlist

The Neon registry has been seeded from the existing central registry. The target six standalone Vercel projects use their existing origins and callback paths. The holding platform has its own callback. Other legacy company registry rows are retained but should not be switched until those apps are migrated.

## Transition safety

Do not disable Supabase Auth, remove legacy Supabase environment variables, or switch any company app's production login yet. The six app clients still need to be integrated with this API, the legacy user identities need a reviewed import/linking plan, and Google OAuth must be configured and tested end-to-end first.

The current API now includes Google OAuth start/callback/exchange, company-scoped sessions, refresh-token rotation, logout/revocation, session validation, and phone/legal-name identity onboarding. Password login and all six company-app client integrations remain required before this can replace the legacy production auth flow.
