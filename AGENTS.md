# AGENTS.md

## Project context
Xedruo Platform is the control plane for the Xedruo ecosystem and is approved to become a full Xedruo-owned Backend-as-a-Service (BaaS). The database foundation is Neon PostgreSQL. Neon supplies database infrastructure; Xedruo owns APIs, control plane, authorization, tenant isolation, developer experience and operations.

Supabase is not the target backend. Existing Supabase SDK imports, environment references, data and services are legacy migration dependencies until each path has been replaced and verified. Never delete legacy records, projects, credentials or secrets without explicit approval and a tested migration/backup.

## Architecture boundaries
- Independent company apps own their UI, customer routes, callback handlers and dashboards; they integrate with Xedruo through versioned APIs.
- Xedruo Platform is the BaaS control plane and administrator/developer console, not a customer login destination.
- Shared service domains include identity/authentication, company/project registry, database management, protected data APIs, storage, realtime/events, functions/jobs, developer tools, usage, monitoring, support and audit.
- Keep Neon owner credentials server-side. Browser/mobile clients call protected Xedruo APIs.
- Derive company/tenant context from verified credentials and server-side registry records, never arbitrary client input. Enforce company data isolation and least privilege.
- Preserve the central identity requirements: random 10-digit ID with country metadata, Google sign-in, Xedruo ID/password alternative, legal name and phone collection; SMS verification is not currently required.
- Customer sign-in returns to the originating company's approved callback/dashboard. Never fall back to the platform home.
- Platform administrator authentication remains separate from customer authentication.

## Current implementation caution
The central auth gateway uses `@neondatabase/serverless` and `DATABASE_URL`. Do not assume the entire platform is Supabase-free: frontend client and media API still contain Supabase Auth/data/storage dependencies. Replace these through staged, tested migrations before removing the package or environment variables.

Full BaaS scope is a target architecture, not a claim that every service is implemented. See `docs/full-neon-baas-architecture.md` for the decision record, current audit and migration gates.

## Development and release
- Use `npm run dev`, `npm run lint`, `npm run typecheck` and `npm run build`.
- Test schema migrations on a Neon branch; use direct connections for migrations and pooled connections for normal application traffic.
- Never expose service keys, signing secrets, OAuth secrets, storage credentials or VAPID private keys.
- Enforce least privilege for governor, ceo, cfo, developer, customer_service and operations roles; audit sensitive actions.
- Keep product changes in each product's own repository. Keep platform/shared-service code here and shared database migrations in the designated database repository after confirming its current Neon workflow.
- Preserve Android/mobile behavior unless explicitly included in scope.
- Do not deploy production changes until build, security, smoke and end-to-end checks pass.
