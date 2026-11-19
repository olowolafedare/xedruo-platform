# Xedruo Platform — Full BaaS Architecture (Neon)

**Decision record — 19 November 2026**

- Database foundation: **Neon PostgreSQL**.
- Product scope: **Full Backend-as-a-Service (BaaS)** operated by Xedruo Platform.
- Supabase: **not an approved target dependency**. Existing Supabase code, credentials and data are legacy migration items until each dependent flow has been replaced and verified.
- Hosting: company frontends remain independently owned and deployed (currently Vercel projects linked to separate GitHub repositories).
- Platform role: API/control plane and developer infrastructure, not a customer-facing company dashboard or a mandatory login redirect.

## 1. Product definition

Xedruo Platform is to become Xedruo's own Supabase-like backend provider. Neon supplies managed PostgreSQL infrastructure; Xedruo owns the customer/developer product, control plane, API contracts, authorization rules, tenant isolation, service orchestration, usage metering, operations and support.

Neon is the database foundation, **not by itself the complete Xedruo BaaS**. Do not describe the platform as a finished Supabase replacement until the service domains below are implemented, secured, documented and tested.

## 2. Target architecture

```text
Independent Xedruo company apps (web / mobile / partner clients)
       |  HTTPS, company-scoped API keys or user access tokens
       v
Xedruo Platform API Gateway (versioned public APIs)
       |
       +-- Identity & Authentication service
       +-- Company / Project Registry and tenant authorization
       +-- Database management & provisioning control plane
       +-- Data API / application service APIs
       +-- Object & media storage API
       +-- Realtime / event delivery
       +-- Functions, webhooks and scheduled jobs
       +-- Developer console, keys, logs, usage and billing
       +-- Monitoring, audit, support and governance
       |
       v
Neon PostgreSQL projects / branches / pooled connections
       |
       +-- Platform control-plane database (identity, registry,
       |   projects, plans, usage, audit and service metadata)
       +-- Isolated company data stores (per-project or approved
           tenant-isolated schemas/roles, decided by data classification)
```

The gateway is the public trust boundary. Browser/mobile clients must not receive Neon owner credentials or unrestricted database connection strings. All privileged data access must pass through authenticated, authorized service endpoints. Use pooled Neon connections for normal serverless request traffic and direct connections for schema migrations and administrative tasks.

## 3. Service domains and ownership

| Domain | Xedruo-owned capability | Initial implementation direction |
|---|---|---|
| Authentication | Account lifecycle, Google OAuth, Xedruo ID/password, sessions, refresh/revocation, recovery, MFA policy | Harden the existing central gateway; retain Xedruo-issued identity as the canonical identity |
| Unified Identity | Random 10-digit numeric ID, country metadata, legal name, E.164 phone, identity status and audit | Neon-backed identity tables and versioned identity API |
| Company & Project Registry | Company slugs, projects, origins, callbacks, allowed scopes, environments, status | Control-plane tables; strict server-side tenant checks |
| Database service | Create/manage project databases, branches, credentials, migrations, backups/recovery metadata, health | Neon management integration behind a privileged control-plane service |
| Data APIs | Versioned REST APIs, CRUD, validation, pagination, filtering, policy enforcement | Xedruo API handlers querying PostgreSQL; never expose owner credentials |
| Storage & media | Upload authorization, object metadata, signed URLs, lifecycle and CDN delivery | Keep existing R2/Bunny media path where appropriate; unify behind Xedruo Storage API |
| Realtime & events | Subscriptions, webhooks, event delivery and retry handling | Evaluate Neon Realtime / event delivery after region and workload validation |
| Functions & jobs | Customer functions, webhooks, scheduled work, retries and execution logs | Start with controlled server-side functions; add Neon Functions/queue provider only after operational review |
| Developer platform | Projects, API keys, environment separation, docs, SDKs, logs, usage, limits | Platform developer console and service APIs |
| Operations & governance | Monitoring, audit, support tools, incident controls, role-based administration | Central audit trail, least-privilege roles and explicit approvals |

Neon-specific features (Auth, Object Storage, Functions, AI Gateway, Realtime or Data API) are optional implementation choices, not automatic requirements. Keep the existing Xedruo authentication design unless a deliberate migration is approved. Do not expose Neon Data API/PostgREST directly to new browser clients; enforce authorization in Xedruo services.

## 4. Identity and company login contract

- One ecosystem-wide Xedruo identity is shared by all registered companies.
- Xedruo ID is a unique random 10-digit number with country prefix/metadata (for example NG, US, CN); phone country calling code remains separate from the country identity code.
- Registration requires Google sign-in, legal name, country and phone number. Phone is collected in E.164 format; SMS verification is not required in the current product decision.
- Xedruo ID/password is an alternative sign-in method.
- The company app starts authentication and receives the result at its own exact registered callback. Successful login ends on that company's own dashboard.
- Platform administrator login is a separate protected control-plane path; the platform is not a customer login destination.
- Every token/session is audience-bound to the requesting company. Validate issuer, audience, expiry, session revocation, company status, scopes and user status on every protected request.
- Never put access or refresh tokens in URL query strings or fragments.

The current gateway source already uses `@neondatabase/serverless`, `DATABASE_URL`, a signing secret and a central Google callback. Treat these as an existing implementation baseline, not proof that every authentication and BaaS requirement is complete.

## 5. Data isolation and security model

1. Control-plane data belongs to Xedruo Platform and is not directly writable by company frontends.
2. Each company receives a registered project/tenant identity, environment separation, scoped credentials and explicit API permissions.
3. Company data must be isolated. Prefer separate Neon projects for strong isolation where cost/operations permit; use separate databases/schemas and non-owner roles only where the isolation model has been threat-reviewed and tested.
4. A company must never be able to select another company's tenant ID and access its data. Derive tenant context from verified credentials and registry records, not from an untrusted request body.
5. Keep database owner credentials, OAuth secrets, signing keys, storage secrets and VAPID private keys server-side.
6. Use short-lived access tokens, refresh rotation, revocation, rate limits, abuse controls, audit logs and safe generic authentication errors.
7. Enforce least privilege for CEO, governor, finance, customer service, developer and operations roles. Customer-service access must be purpose-limited and audited.
8. Use branch-based schema testing; run migrations with a direct connection on a tested branch before production. Backups/restore procedures and migration rollback plans are release gates.
9. Do not run destructive SQL, delete legacy data or remove credentials without explicit approval and a verified replacement/backup.

## 6. Current infrastructure observations (read-only audit, 19 November 2026)

### Confirmed
- GitHub repository: `olowolafedare/xedruo-platform`; default branch `main`.
- Platform Vercel project: `xedruo-platform`, Vite, Node.js 24.x.
- Platform Neon project: `solitary-grass-19539960` (`xedruo-platform`), PostgreSQL 17, `aws-eu-central-1`, default compute range 0.25–0.25 CU.
- Separate Neon project `small-mode-00000410` (`xedruo-central-auth`), PostgreSQL 18, `aws-us-east-2`, default compute range 0.25–2 CU.
- Additional Neon projects currently visible: `xedrion-ai`, `xedruo-career`, `xedruo-pay-and-play`, `xedruo-music-distribution`, and `adom-global-commerce`. Their existence does not prove their apps are already using Xedruo's BaaS APIs.
- Central auth source imports `@neondatabase/serverless` and reads `DATABASE_URL`; its file header explicitly describes no Supabase dependency for that gateway.
- Existing `api/media.js` already uses Cloudflare R2 presigned uploads and Bunny CDN URL construction, but still uses Supabase Auth and Supabase database queries to authenticate the user and check track ownership.
- `src/api/xedruoClient.js` is still substantially Supabase-backed: Auth, profiles, roles, identity, core API token acquisition and Storage operations use `@supabase/supabase-js`.
- `package.json` still includes `@supabase/supabase-js`.
- Repository instructions and several architecture/migration documents still describe Supabase as the active backend. These are stale/inconsistent with the new decision and must be reconciled.
- Latest observed platform production deployment is in Vercel state **ERROR**. Build logs show TypeScript error `lib/xedruo-auth-handler.ts(239,151): Cannot find name 'verified'`. The latest build also emits a large-bundle warning (~920 kB minified JS) and dependency audit warnings. These are current blockers; this document does not claim they have been fixed.

### Not yet verified
- Whether every company app has migrated away from Supabase Auth, direct Supabase table access, Edge Functions and Supabase Storage.
- Whether any Vercel production environment still has Supabase variables configured. Variable values were not read or disclosed in this audit.
- Whether all seven visible Neon projects are production-connected, correctly isolated, backed up and governed by the platform.
- Whether the platform Neon project contains all required control-plane tables and production-grade constraints, indexes, roles and backup policies.
- Whether all company callbacks, API scopes, token exchange and own-dashboard return flows pass end-to-end tests.
- Whether Xedruo BaaS services beyond the central authentication baseline (developer console, database provisioning, Data API, Storage API, Realtime, Functions, metering and billing) are implemented.

## 7. Migration priorities

### P0 — Stabilise and establish the real source of truth
- Fix the TypeScript build error in the central auth handler and verify a production build.
- Inspect the platform and central-auth Neon schemas, roles, branches, backup settings and usage. Confirm which Neon project is authoritative for identity/control-plane data before merging or moving records.
- Map every active Supabase code path and environment variable name across the platform and company repositories. Do not delete data or secrets during inventory.
- Make the canonical API contract and company registry the only approved integration path for shared identity.

### P1 — Remove Supabase runtime dependencies safely
- Replace platform frontend AuthContext/client calls with Xedruo authentication/session APIs.
- Replace direct identity/profile/role table reads with protected Xedruo Identity and Authorization APIs.
- Replace Supabase Storage with Xedruo Storage API backed by the approved object store (existing R2/Bunny path is a candidate).
- Replace media route's Supabase token validation and track ownership lookup with Xedruo session validation and a company-scoped Music Distribution API.
- Replace Supabase Edge Function/core API calls with versioned Xedruo service APIs.
- Migrate and reconcile existing user/account/identity data only through a reviewed, repeatable import/linking plan. Preserve account continuity; do not reset or delete old records by assumption.
- Remove the SDK, fallback URLs, stale environment variable references and Supabase instructions only after the replacement flow passes tests.

### P2 — Deliver BaaS foundations
- Define tenant/project/environment model, service scopes, API key lifecycle and key rotation.
- Publish OpenAPI specifications, versioning policy, error contract, rate limits and SDK integration examples.
- Deliver developer console for project creation, keys, database lifecycle, usage, logs and docs.
- Deliver Storage API, webhook/function execution, event delivery and observability with explicit service SLAs.
- Add usage metering, plan limits and billing hooks only after the usage model is agreed.

### P3 — Production readiness
- Pilot with one standalone company, then migrate the remaining apps in batches.
- Run automated tests for OAuth/PKCE, Xedruo ID/password, refresh/revocation, company isolation, callback safety, profile/identity, media upload, support access and admin permissions.
- Test restore, migration rollback, incident response and key rotation.
- Confirm all apps keep their own dashboard and do not redirect customers to the holding platform.
- Remove Supabase from runtime and deployment configuration only when no production request depends on it.

## 8. Definition of done

Xedruo may claim to provide a full BaaS only when the developer can create a project, obtain scoped credentials, provision/manage its database, authenticate users, call protected data APIs, upload/download files, receive events/realtime updates, run approved functions/jobs, inspect logs/usage, manage environments and recover data — with documented isolation, security, limits and support. All capabilities must be proven by automated and production smoke tests.

## 9. Decision boundaries

This is an architecture decision and audit update, not authorization to delete Supabase projects/data, rotate secrets, migrate production user records, change company deployments, alter mobile/Android apps, or apply database migrations. Those are separate controlled changes requiring compatibility checks and release verification.
