# Xedruo Platform — Technical Management and BaaS/AI Builder Expansion

## Delivery rule
This work is additive. Preserve every existing page, route, component, user record, integration, and workflow. Do not replace the current management portal or customer-facing company applications. Add new capabilities behind the existing platform shell and existing administrator authentication boundary. Any migration that changes an existing contract must be backward-compatible and separately tested.

## Product outcome
Xedruo Platform becomes the group's internal operating system and a first-party developer platform combining:
1. Supabase-class backend services, owned and operated by Xedruo.
2. Base44-class AI application building and deployment workflows, owned and operated by Xedruo.
3. Group staff, governance, finance, customer service, and technical operations.

"Supabase-class" and "Base44-class" describe capability targets, not dependencies. Production database is Neon PostgreSQL. Object storage is Cloudflare R2. Media delivery is Bunny CDN. Deploy the platform on Render. Do not introduce Supabase as a production database, auth, or storage dependency in the target architecture.

## Existing platform protection
- Keep existing Management, Parent Company, role areas, company directory, and currently working business modules.
- Add a new navigation group and route namespace for the seven executive units.
- Existing route URLs must continue to resolve.
- Do not change customer login, company callback, or standalone company routing as part of this expansion.
- Do not remove legacy adapters until their replacements pass production parity tests.
- Use additive database migrations and feature flags. Never drop or rewrite existing tables as part of initial rollout.

## Seven unit portals
Each unit has a distinct entry URL, portal landing page, menu, and permission bundle, backed by the same secure administrator identity/session service. A user can only enter units explicitly granted to that account. The URL or selected portal must never grant a role.

1. Chairman — governance, board oversight, reserved approvals, risk, strategic direction.
2. CEO — executive operations, group strategy, company performance, delegated approvals.
3. CFO — budgets, treasury oversight, revenue, expenses, payroll controls, financial reporting.
4. COS — Chief of Staff; executive coordination, assignments, meeting actions, follow-ups, decision register.
5. Operations — operating procedures, company status, staff coordination, service-level performance.
6. Customer Service — customer lookup, cases, tickets, escalations, service quality; no password or secret access.
7. CTO / Technical Management — one unit and one portal, not separate departments. Owns technical architecture, developer platform, security, releases, infrastructure, APIs, observability, and AI app builder operations.

## Access request and approval
Provide a public, non-authenticated access-request form before any staff login is issued. Collect legal name, work email, requested unit, position, reason, and optional manager/sponsor. Store requests as pending; do not create active credentials or grant roles on submission. Notify the designated approver and retain the decision in an immutable audit trail.

Default approval matrix for initial implementation:
- Chairman appointment: ownership/board authority.
- CEO, CFO, CTO: Chairman approval.
- COS, Operations, Customer Service: CEO approval (or explicitly delegated approver).
- Privileged access changes and cross-unit grants: Chairman or delegated security administrator approval.
This matrix must be configurable, with separation of duties. A requester cannot approve their own request.

## Supabase-class Xedruo backend services
Build these as Xedruo-owned APIs and console modules over Neon:
- Authentication and identity: account lifecycle, sessions, MFA-ready factors, password reset, service identities, role and permission checks.
- Database projects: project registry, isolated schemas/databases, connection management, migration history, backups/restore workflows, usage limits.
- API platform: versioned REST endpoints, API keys, scoped tokens, rate limits, request logs, OpenAPI documentation.
- Storage: R2 buckets, upload/download policies, signed URLs, lifecycle rules, quotas; Bunny CDN for delivery and cache controls.
- Realtime: event bus and authenticated subscriptions for app events, database change notifications, and operational status.
- Functions and jobs: server-side functions, scheduled jobs, queues, retries, execution logs, secrets injection.
- Observability: audit events, request traces, error logs, metrics, health checks, alerts, usage and cost dashboards.
- Developer console: projects, environments, credentials, API docs, SDKs, webhooks, usage, and release history.

Tenant isolation is mandatory: every project, API key, query, object, event, and job must be scoped to an authenticated owner and project. Do not expose Neon superuser credentials to browser clients. Use least-privilege database roles and parameterized SQL.

## Base44-class AI app builder
Add a first-party builder workspace within the CTO portal:
- Natural-language app brief and requirements clarification.
- Generate a project plan, data model, page map, API contracts, and implementation tasks.
- Generate/edit frontend and backend code in an isolated project workspace.
- Connect approved Xedruo identity, Neon database, R2 storage, realtime, functions, and APIs.
- Preview and test in a sandbox before publishing.
- Version history, diffs, checkpoints, rollback, environment variables/secrets, and deployment approvals.
- Deploy approved projects to Render; keep standalone company repositories and production ownership independent.
- Monitor builds, deploys, runtime errors, usage, and security checks.
- Human approval before production deployment, secret changes, destructive database operations, or cross-company access.

Generated code is untrusted until reviewed and tested. The builder must not silently change existing production applications or credentials.

## CTO / Technical Management command centre
One dashboard to manage:
- Architecture map and service catalogue.
- Render services, deployment status, logs, metrics, and release approvals.
- Neon projects, database health, migrations, backups, and connection limits.
- R2 buckets, Bunny zones, storage and delivery health.
- Authentication, identity, role policies, API gateway, keys, and webhook health.
- AI builder workspaces, generated projects, test status, and deployments.
- Security posture, vulnerabilities, incidents, audit trails, and access reviews.
- Engineering staff, work queues, code reviews, change requests, and release calendar.

## Group-wide management capabilities
- Staff directory, units, roles, onboarding, offboarding, and access reviews.
- Finance: budgets, spend requests, approvals, expenses, revenue, treasury views, and reporting.
- Payroll and compensation records with restricted access.
- Customer service: customer cases, escalations, response SLAs, and audit history.
- Company registry and operational health across standalone products.
- Audit log for every privileged read/write, approval, financial action, access grant, secret operation, and deployment.

Financial controls must remain separate from CTO technical privileges. CTO can manage technical infrastructure but cannot approve treasury transfers or alter financial records solely by virtue of CTO role.

## Technical architecture
- UI: extend the existing React/Vite application with additive route groups and shared shell components.
- API: versioned Xedruo-owned service layer; browser clients never connect to Neon directly.
- Database: Neon PostgreSQL, with additive migrations and tenant/project isolation.
- Storage: Cloudflare R2.
- CDN: Bunny CDN.
- Hosting: Render.
- Background work: durable jobs/queues and scheduled workers.
- Security: central authorization middleware, role/permission grants, audit events, rate limiting, secrets manager integration, and per-project scopes.

## Implementation sequence and release gates
1. Baseline inventory: map current routes, pages, auth/session handlers, admin tables, migrations, and existing APIs. Capture a main-branch baseline and smoke-test existing behavior.
2. Fix and verify the current Render homepage and API health before feature rollout. A deployment marked "live" is not sufficient; verify real HTTP status and response body.
3. Additive access foundation: access request, approval workflow, unit/permission catalogue, audit events, and seven unit entry routes.
4. CTO / Technical Management shell and infrastructure inventory, with read-only integrations first.
5. Group staff, finance, operations, and customer-service modules with explicit permission checks.
6. Xedruo backend service foundations: identity/auth, projects, API keys, storage adapter, realtime/events, functions/jobs, logs/metrics.
7. AI app builder: isolated workspace, generated code, preview/test, versioning, deployment approvals.
8. Integrate Neon, R2, Bunny, and Render; add quotas, isolation, backups, monitoring, and security testing.
9. Migrate or replace any legacy Supabase-backed platform dependency only after parity tests, data reconciliation, rollback plan, and user approval. No production data deletion.
10. Production rollout behind feature flags, smoke tests, role-by-role access tests, backup verification, and rollback readiness.

## Definition of done
- Existing platform functionality and URLs continue to work.
- Seven distinct unit portals exist; CTO is the single Technical Management portal.
- Access requests require approval before account activation and role grant.
- Unit access is enforced server-side, not by frontend hiding.
- Supabase-class backend capabilities are provided by Xedruo services on Neon/R2/Bunny/Render.
- Base44-class AI builder can create, preview, test, version, and deploy applications with human approval.
- Finance and technical privileges are separated.
- All privileged operations are audited.
- Render homepage and API health are independently verified over HTTP.
- No feature is described as production-ready until its release gates pass.
