# Xedruo Central Services Architecture

## Non-negotiable customer journey
Customer-facing companies own their own login, registration, callback, session, and dashboard experience. A customer must never be redirected to the Xedruo Platform for login or after login.

The Xedruo Platform is the ecosystem administration console and central service control plane. It is not a customer authentication landing page.

Each company application calls central Xedruo APIs from its own trusted integration. Authentication returns to the originating company's registered callback and then to that company's own dashboard.

## Architecture boundaries
- Company application: company-owned UI, routes, callback handler, business data, and dashboard.
- Central identity/authentication: shared Xedruo account, 10-digit random Xedruo ID, country-issued prefix, Google provider, password sign-in, phone collection, legal name, session validation.
- Company registry: canonical company slug, enabled state, exact production origins, approved callback URLs, allowed logout URLs, API scopes, and key status.
- Central administration: company governance, pricing, revenue, support, customer monitoring, software releases, developer access, audit.
- API gateway/service layer: authenticated, authorized, company-scoped, versioned service endpoints. Platform UI and company applications consume APIs; staff workflows do not query another company's database directly.

## Customer authentication flow
1. Customer opens a company app and chooses sign in or register.
2. Company app calls the central Authentication API with its registered company slug and an approved return route.
3. For Xedruo ID/password, the central API validates company registration and request origin, verifies credentials, and returns a short-lived session response directly to the calling company app over HTTPS. It does not redirect the browser to the platform.
4. For Google, the company app initiates the shared Supabase OAuth/PKCE flow with its own exact registered callback URL. The provider callback returns to that company app, never to the platform. The company callback exchanges the authorization code using the same PKCE verifier and establishes its local app session.
5. The company app checks central identity and company membership/profile through the central API.
6. The company app routes the customer to its own dashboard.

If company registration, origin, callback, PKCE state, or membership validation fails, fail closed with an actionable error. Never fall back to the platform home or dashboard.

## Identity requirements
- One ecosystem-wide Xedruo identity.
- Random unique 10-digit numeric identifier with issuing-country prefix/metadata (NG, US, CN, etc.).
- Country selection and calling code displayed separately; country directory currently contains 201 rows.
- Phone number collected and stored in E.164 format. SMS/phone OTP verification is not a prerequisite for login or onboarding; phone_verified_at remains null until a real verification event occurs.
- Full legal name is collected for future KYC.
- Google and Xedruo ID/password are supported sign-in methods.
- No guest accounts.
- Platform administrators use a separate administrator authentication and authorization path; no customer Google login on the platform.

## Security requirements
- Never place access or refresh tokens in URL query strings or fragments.
- OAuth uses authorization code + PKCE; validate state and exact callback allowlists.
- Company context is bound server-side to registered company identifiers, not trusted from arbitrary client-supplied slugs.
- CORS allows only verified company origins. CORS is not an authorization boundary.
- API scopes are least-privilege and company-scoped. Verify authenticated subject and company membership on every request.
- Service-role credentials remain server-side only.
- Apply rate limits and abuse controls to public login endpoints; return generic credential errors.
- Audit administrator and sensitive customer-service actions.
- Customer service cannot view passwords or change credentials; developers cannot receive unrestricted production access.
- RLS policies must reflect actual ownership and company scopes. Do not create blanket policies to silence advisor warnings.

## API domains
- Identity & Security: authentication, identity, company registry, authorization, session, access grants.
- Customer Operations: customer profile lookup, customer monitoring, support tickets, service cases, notifications.
- Finance & Commerce: pricing, sales, revenue, billing, payments, refunds, subscriptions.
- Technology Operations: software updates, release channels, developer workspace, app scaffolding, CI/deployment approvals, integrations, health checks.
- Governance & Intelligence: analytics, audit logs, incident management, reporting, export.
- Company Operations: company configuration, product catalog, service status, operational settings.

## Initial API contract outline
All routes are versioned under a stable gateway prefix. Request and response schemas must be published and tested before app migrations.

- POST /auth/v1/id/login — Xedruo ID + password; requires registered company context and verified origin; responds to the company app, no browser redirect.
- POST /auth/v1/id/register — creates/links identity with legal name, country and phone; does not require SMS verification.
- GET /identity/v1/me — current identity and permitted profile fields.
- GET /companies/v1/registry/{slug} — public, non-sensitive company metadata only.
- POST /companies/v1/session/validate — validates session and company entitlement.
- GET /companies/v1/callbacks — server-only approved callback resolution.
- /finance/v1/pricing, /finance/v1/revenue, /support/v1/tickets, /customers/v1/monitoring, /releases/v1/updates, /developer/v1/projects — protected by role, scope, and company boundaries.

The outline is a target contract, not a claim that every endpoint is already deployed.

## Migration and release gates
1. Inventory all company repositories, production Vercel projects, domains, callbacks, auth flows, and environment configuration.
2. Verify and populate company registry origins and callback allowlists from actual Vercel project/domain configuration.
3. Harden and test central auth endpoints; add rate limiting, company binding, origin checks, audit events, and safe error handling.
4. Implement shared company-side auth client and callback adapters appropriate to each framework (React/Vite vs Next.js vs Expo).
5. Migrate one pilot company and run real Google and Xedruo ID/password end-to-end tests.
6. Migrate remaining companies in controlled batches; verify every callback and dashboard destination.
7. Retire platform customer-login and token-handoff routes only after all company apps are migrated and admin login remains independently available.
8. Deploy production changes only after build, security, smoke, and end-to-end checks pass.


## Verified deployment inventory (4 November 2026)

The following company origins were verified against the team's Vercel project/domain records and recorded in `public.xedruo_company_app_registry.app_origin`. These are the standalone application origins selected for the current migration; callback paths still need per-app code and Supabase Auth allowlist verification.

| Company slug | Vercel project | Git repository | Registered origin |
|---|---|---|---|
| adom-global-commerce | adom-global-commerce | olowolafedare/adom-global-commerce | https://adom-global-commerce.vercel.app |
| healthruo | healthruo-standalone | olowolafedare/Healthruo- | https://healthruo-standalone.vercel.app |
| hireuo | xedruo-career | olowolafedare/xedruo-careers | https://hireuo.xedruo.com |
| pay-and-play | xedruo-pay-and-play | olowolafedare/Xedruo-pay-and-play | https://xedruo-pay-and-play.vercel.app |
| spacetruo | spacetruo-standalone | olowolafedare/Spacetruo- | https://spacetruo-standalone.vercel.app |
| sportruo | sportruo | olowolafedare/Sportruo | https://sportruo.vercel.app |
| xedrion-ai | xedrion-ai | olowolafedare/Xedrion-Ai- | https://xedrion-ai.vercel.app |
| xedruo-global-logistics | xedruo-global-logistics | olowolafedare/Xedruo-globa-logistics | https://xedruo-global-logistics.vercel.app |
| xedruo-music | xedruo-music-distribution | olowolafedare/Xedruo-Music-Distribution | https://xedruo-music-distribution.vercel.app |
| xedruo-properties | xedruo-properties-standalone | olowolafedare/Xedruo-properties- | https://xedruo-properties-standalone.vercel.app |

The platform project is linked to `olowolafedare/xedruo-platform` and owns `xedruo.com` / `www.xedruo.com`; its registry row intentionally remains without a customer-app origin because the platform is the admin/control plane, not a customer product login.

### Deployment separation findings

- Vercel still has legacy projects `spacetruo`, `healthruo`, and `xedruo-properties` linked to the central `xedruo-platform` repository.
- The intended standalone projects `spacetruo-standalone`, `healthruo-standalone`, and `xedruo-properties-standalone` are linked to their corresponding company repositories and have ready production deployments.
- The legacy projects' latest production deployments were cancelled at the time of inspection; do not use them as the customer app targets.
- The 10 company origins above have been written to and read back from the Supabase registry. This does not yet configure callback allowlists or enable strict CORS.

## Known audit blockers
- Company registry has 11 enabled records; the 10 product origins are now populated and verified against Vercel domains. The platform/admin row remains null by design. Callback allowlists are not represented in the inspected registry schema.
- Current xedruo-id-login endpoint has wildcard CORS, accepts no company context, and returns auth tokens without checking a registered calling company.
- Platform customer login currently includes phone OTP and hardcoded destination routing; it hands tokens to company apps in URL fragments and has a platform fallback.
- Some inspected company identity gates read identity and country data directly from Supabase instead of using the intended central API.
- Six tables have RLS enabled but no policies; these require access-model review, not blanket policy creation.
- Leaked-password protection is disabled in Supabase Auth.
- Platform and Music use Vite/React; Xedrion AI and Hireuo use Next.js; other company app frameworks require repository-level confirmation. Callback implementations must be framework-specific.

## Definition of done
- No customer login journey loads the Xedruo Platform.
- No successful customer auth flow redirects to the platform.
- Every company login starts and ends on the same company origin.
- No auth tokens are placed in URL fragments or query strings.
- Google OAuth and Xedruo ID/password both pass end-to-end tests.
- SMS verification is not required; legal name and phone are collected.
- Central APIs enforce company scope and role permissions.
- All deployments are verified against the correct standalone Vercel project and production domain.
