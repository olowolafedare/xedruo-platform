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

## Known audit blockers
- Company registry currently has 11 enabled records but every app_origin is null; callback allowlists are not represented in the inspected registry schema.
- Current xedruo-id-login endpoint has wildcard CORS, accepts no company context, and returns auth tokens without checking a registered calling company.
- Platform customer login currently includes phone OTP and hardcoded destination routing; it hands tokens to company apps in URL fragments and has a platform fallback.
- Some inspected company identity gates read identity and country data directly from Supabase instead of using the intended central API.
- Six tables have RLS enabled but no policies; these require access-model review, not blanket policy creation.
- Leaked-password protection is disabled in Supabase Auth.
- Platform and music apps use Vite/React; Xedrion AI uses Next.js. Callback implementations must be framework-specific.

## Definition of done
- No customer login journey loads the Xedruo Platform.
- No successful customer auth flow redirects to the platform.
- Every company login starts and ends on the same company origin.
- No auth tokens are placed in URL fragments or query strings.
- Google OAuth and Xedruo ID/password both pass end-to-end tests.
- SMS verification is not required; legal name and phone are collected.
- Central APIs enforce company scope and role permissions.
- All deployments are verified against the correct standalone Vercel project and production domain.
