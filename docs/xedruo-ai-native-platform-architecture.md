# Xedruo AI-Native Platform Architecture

## Product definition
Xedruo is the group's AI-native operating and application-building platform. It is not merely an administration dashboard. Its integrated builder must let authorised developers build, edit, test and maintain:
1. The Xedruo platform itself (the platform/control-plane project).
2. Each independent Xedruo company application.

The integrated builder uses Xedrion AI as the shared AI engine through a centrally governed Xedruo AI API. Do not introduce a separate model provider integration in each company frontend.

## Core architecture
- GitHub is the source of truth for source code, branches, pull requests, reviews and commit history.
- Vercel builds preview and production deployments for the platform and each company project.
- Neon stores platform metadata, company registry, developer permissions, API credentials metadata, usage, audit records, deployment approvals and project links. Secrets must not be stored in plaintext.
- Cloudflare manages DNS, CDN, WAF and traffic routing.
- Cloudflare R2 stores generated assets, user uploads, build artifacts or other object data where appropriate.
- Cloudflare Workers are optional edge functions/proxies only where needed. They are not the source of truth for application code, authentication or deployment state.
- Xedruo central APIs own identity, authorization, company registry, project registry, AI gateway, release approvals and audit logging.

## Developer Studio
The Developer Studio must have a project scope selector with at least:
- Xedruo Platform (the platform repository and its own Vercel project).
- A registered company application (company repository and Vercel project).

The same workspace capabilities should be available in both scopes, subject to role permissions:
- AI-assisted feature planning and code generation using Xedrion AI.
- Repository and branch selection.
- File editing and change review.
- Commit/pull-request workflow.
- Preview deployment and test results.
- Deployment request and release history.
- Project environment/configuration metadata (never reveal secret values).
- Project-specific logs and health checks.

The platform project is not an ordinary company tenant: its write access is restricted to authorised platform developers and the Technical Officer. Platform changes must have stricter review and release controls.

## Xedrion AI shared API
Xedrion AI is the intelligence engine. The platform must call it through a stable server-side Xedruo AI API/gateway, not directly from browser code.

Required API contract (implementation must be verified against the actual Xedrion service before enabling):
- POST /api/ai/v1/generate — structured code/task generation.
- POST /api/ai/v1/chat — interactive builder conversation.
- POST /api/ai/v1/review — review proposed diffs and identify risks.
- GET /api/ai/v1/models — list enabled capabilities/models for this tenant.
- GET /api/ai/v1/usage — usage and cost metering for authorised company/project.

These are target gateway routes, not a claim that they already exist. The gateway must adapt to the actual Xedrion AI backend contract. Never invent an upstream endpoint or silently substitute another AI provider.

Security requirements:
- Authenticate staff with central Xedruo session.
- Authorize each request against project membership, company scope and action permissions.
- Keep Xedrion credentials server-side in Vercel environment secrets or an approved secret manager.
- Issue scoped, revocable project/company credentials where service-to-service access is required.
- Enforce rate limits, quotas, request size limits, audit events and per-project usage.
- Treat model output as untrusted code: show diffs, run tests and security checks; never automatically publish generated code.

## Build and release workflow
1. Developer selects Platform or a company project.
2. Developer describes a task to Xedrion AI.
3. AI returns a plan and proposed changes.
4. Developer reviews and applies changes in a feature branch.
5. GitHub records commits and pull requests.
6. Vercel creates a preview deployment.
7. Automated tests, dependency checks, secret scanning and project health checks run.
8. Developer submits a release request with diff, preview and test evidence.
9. Technical Officer approves or rejects production publishing.
10. Approved release is promoted to production; health checks run and rollback remains available.

Developers cannot approve their own production release. Production approval is enforced server-side and must not be bypassable through a direct Vercel production deployment path.

## Department operations
- CEO: group oversight and strategic approvals.
- CFO: finance and cost visibility, including AI spend allocations.
- HR: creates staff username, initial password, department and role directly; no invite email required. Initial password must be changed at first login.
- Customer Service: cross-company support access according to ticket assignment and data policy.
- Technical Officer: infrastructure, security, company integrations, API governance, review and production approval.
- Developer: authorised platform and/or company project work, never automatic production approval.

## Multi-company isolation
Each company keeps its own repository, Vercel project, domain, UI and application data. Shared services are consumed through APIs. Project and company scope must be checked server-side for every read and write. The platform's own project is a distinct protected scope.

## Platform continuous updates
The platform itself must use the same AI-assisted build lifecycle, with protected platform branches, preview-first changes, approval gates, versioned APIs, database migration review, feature flags and rollback. Platform updates must not silently break company applications. Shared APIs require versioning and deprecation windows.

## Delivery phases
1. Stabilise platform identity, staff roles, audit logging and project registry.
2. Implement project scope selector for Platform + companies.
3. Verify Xedrion AI backend API contract and build secure Xedruo AI gateway.
4. Add AI builder conversation, plan/diff review and controlled code application.
5. Integrate GitHub branch/commit/pull-request operations.
6. Integrate Vercel preview deployment and test results.
7. Enforce Technical Officer production approval and rollback.
8. Add finance usage metering and company-level AI quotas.

## Acceptance criteria
- A developer can select Xedruo Platform or an authorised company project.
- Both scopes use the same Developer Studio and Xedrion-backed AI builder.
- AI-generated changes are visible as reviewable diffs before they are committed.
- GitHub stores changes in the correct repository and branch.
- Vercel preview is generated for the correct project.
- Production publishing requires Technical Officer approval.
- Company credentials and data are isolated.
- No browser bundle contains Xedrion API secrets.
- No unsupported upstream Xedrion endpoint is assumed.
