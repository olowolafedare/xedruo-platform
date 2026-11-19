# Xedruo Platform

Xedruo Platform is the control plane and intended full Backend-as-a-Service (BaaS) provider for independent Xedruo companies. It exposes shared services through versioned APIs; company apps retain their own customer experience and dashboards.

## Architecture decision
- Database foundation: Neon PostgreSQL.
- Platform scope: full Xedruo-owned BaaS: identity/authentication, company/project registry, database services, protected data APIs, storage, realtime/events, functions/jobs, developer tools, usage, monitoring, support and audit.
- Supabase is not the target backend. Remaining Supabase SDK and runtime paths are legacy migration work; do not remove them until replacements pass production tests.
- Neon is the database foundation, not the whole BaaS product. Xedruo owns the API gateway, control plane, tenant isolation, policies and developer experience.
- Independent companies authenticate through Xedruo APIs and return to their own registered callback/dashboard. The platform is not a customer login redirect.

See [Full Neon BaaS Architecture](docs/full-neon-baas-architecture.md) for the decision record, read-only infrastructure audit and migration plan.

## Getting started
1. Open the relevant company application.
2. Sign in through that company's own login experience.
3. Use the navigation menu for your task.
4. Sign out when using a shared device.

## Xedruo deployment ownership map
The holding platform and operating products are deployed independently. GitHub is the source of truth; the matching Vercel project is the production deployment target.

| Product | GitHub repository | Vercel project |
| --- | --- | --- |
| Holding platform | olowolafedare/xedruo-platform | xedruo-platform |
| Xedrion AI | olowolafedare/Xedrion-Ai- | xedrion-ai |
| SporTruo | olowolafedare/Sportruo | sportruo |
| Pay and Play | olowolafedare/Xedruo-pay-and-play | xedruo-pay-and-play |
| Music Distribution | olowolafedare/Xedruo-Music-Distribution | xedruo-music-distribution |
| SpaceTruo | olowolafedare/Spacetruo- | spacetruo-standalone |
| Healthruo | olowolafedare/Healthruo- | healthruo-standalone |
| Xedruo Properties | olowolafedare/Xedruo-properties- | xedruo-properties-standalone |
| Careers | olowolafedare/xedruo-careers | xedruo-career |
| Adom Global Commerce | olowolafedare/adom-global-commerce | adom-global-commerce |
| Global Logistics | olowolafedare/Xedruo-globa-logistics | xedruo-global-logistics |

The legacy SpaceTruo, Healthruo and Properties Vercel project records are retired. Their standalone projects are authoritative. Do not use the legacy records as application build targets or store product code in the holding platform.

## Release workflow
1. Make product changes in that product's repository.
2. Run the repository's checks and review the change.
3. Merge approved changes to the repository's main branch.
4. Verify the matching Vercel production deployment and product URL.
5. Keep shared identity/database migrations in the designated Xedruo database repository; confirm its Neon workflow and test migrations on a Neon branch before production.
6. Never delete legacy data, credentials, domains or compatibility routes until replacements pass production smoke tests.
