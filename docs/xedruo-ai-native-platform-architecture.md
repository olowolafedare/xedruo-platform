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

## Verified Xedrion AI and GitHub integration requirements

### Xedrion AI plugin
- The Xedrion repository currently exposes its main answer-generation endpoint as `POST /api/search`.
- The verified request fields include `query`, optional `responseMode` (including `code`), and optional `conversation`; the response includes `answer`.
- The platform integration must use a server-side Xedruo gateway/proxy. Do not call Xedrion from browser code with provider credentials.
- Before enabling the plugin, configure the production Xedrion API origin and verify the deployed origin, CORS/network policy, central Xedruo session validation, developer role and project-scope authorization.
- The current Xedrion search handler does not itself establish the platform developer's project permissions. The Xedruo gateway must enforce those permissions before forwarding a request.
- The plugin must pass the selected project scope (platform or company slug) as trusted server-side context, keep conversation history scoped to the active project, and record usage/audit metadata.
- Code-generation output is a proposal only. It must be converted into a reviewable diff before any repository write.

### GitHub application connection
- Register a GitHub App for the Xedruo Developer Studio. Do not reuse the ChatGPT GitHub connector as runtime authentication for the Xedruo website.
- Request only the required repository permissions: metadata read, contents read/write on explicitly installed repositories, and pull-request read/write if PR creation is enabled.
- Installation/repository selection must be explicit and scoped to each staff member's assigned projects.
- Store GitHub App private keys and installation tokens server-side; never return them to the browser or commit them to Git.
- All writes must target a selected feature branch. Production branch protection and review rules remain in force.
- GitHub connection is not complete until OAuth/App installation, token exchange, repository selection, branch read, a test-branch commit and revocation have passed.

### Enablement gate
The Developer Workstation cards are discovery placeholders until the secure Xedruo gateway, Xedrion origin/configuration, GitHub App credentials and end-to-end tests are complete. Do not label either integration connected before those checks pass.

## Xedrion Developer Studio: first live integration slice

The platform now has a server-side Xedrion AI gateway at `POST /api/dev/xedrion` and a Developer Studio chat component. The gateway:
- authenticates the platform staff session using the existing HttpOnly admin session cookie;
- permits only developer, technical officer and governor roles, and blocks staff who must still change their initial password;
- validates the selected project against the platform control-plane scope or enabled company registry;
- forwards code requests using Xedrion's existing `POST /api/search` endpoint with `responseMode: "code"`;
- keeps the Xedrion service origin server-side (`XEDRION_API_ORIGIN`, defaulting to the known production origin);
- limits request size and conversation history, applies a timeout, and does not expose provider credentials.

This is an AI assistance connection, not yet an autonomous coding/deployment agent. The following remain separate implementation milestones and must not be represented as live until built and tested:
1. GitHub App installation, scoped repo selection, branch creation, diff write, pull request and revocation.
2. Vercel project linking, preview deployment, build log inspection and production promotion approval.
3. Cloudflare API token with zone/account scoping for DNS, cache, WAF and Workers/R2 tasks.
4. Render and Hostinger provider-specific OAuth/API token adapters and deployment health checks.
5. GPU server agent runner with isolated ephemeral containers, quotas, network egress controls, secrets injection, command allowlists and kill switch.
6. Durable job orchestration, audit events, rollback, smoke tests and production health verification.

### Universal integration contract

Each provider adapter must expose capability discovery, connection health, least-privilege scopes, dry-run/plan, execute, verify, audit and revoke operations. Credentials are stored only server-side. High-impact actions (production deploys, DNS changes, database migrations, destructive operations, billing and secrets) require a human approval checkpoint. Build/test commands may run automatically only inside an isolated project runner with time, memory, CPU, disk and outbound-network limits.

"Any app" means an extensible adapter framework plus provider APIs/MCP connectors, not unrestricted access to every service. Providers without a public API or supported automation interface require a custom adapter or human-assisted workflow.

### Initial official MCP provider endpoints

These are provider-owned endpoints/docs identified for the adapter rollout. Listing them does not mean they are already authenticated or enabled in Xedruo:
- **Cloudflare:** `https://mcp.cloudflare.com/mcp` — official remote MCP; OAuth or scoped Cloudflare API token. Covers DNS, Workers, R2 and wider Cloudflare API operations.
- **Vercel:** `https://mcp.vercel.com` — official remote MCP with OAuth. Vercel documents a reviewed-client allowlist, so Xedrion must complete client compatibility/approval before assuming production access.
- **Render:** `https://mcp.render.com/mcp` — official remote MCP with OAuth or API-key authentication; workspace selection and destructive-action approvals are important.
- **Hostinger:** `https://mcp.hostinger.com` — official remote MCP with OAuth; Hostinger also documents an API-token-based MCP server.
- **GitHub:** `https://api.githubcopilot.com/mcp/` — official remote MCP with OAuth or a fine-grained PAT. A GitHub App with repository-scoped permissions remains the preferred production identity for Xedruo automation.

Provider documentation:
- Cloudflare: https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/
- Vercel: https://vercel.com/docs/agent-resources/vercel-mcp
- Render: https://render.com/docs/mcp-server
- Hostinger: https://support.hostinger.com/en/articles/11079316-hostinger-api-mcp-server
- GitHub: https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/customize-copilot/extend-copilot-with-tools-and-context/set-up-the-github-mcp-server

### GPU execution
A GPU server is not just another MCP API. Xedruo needs a separate ephemeral runner service that provisions an isolated container/VM with pinned images, per-job credentials, quotas, restricted egress, artifact capture, cancellation and automatic teardown. The runner should accept an explicit task plan from Xedrion, execute only within a project workspace, and return structured logs/test artifacts. Do not give the model a permanent unrestricted SSH shell or root credentials.
