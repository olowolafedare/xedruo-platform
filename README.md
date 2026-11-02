# Using the Xedruo Platform

Use the platform to access the tools and information available to your account.

## Getting started

1. Open the platform using the link provided by your organization.
2. Sign in with your account credentials. Contact your administrator if you need access.
3. Use the navigation menu to find the section for your task.

## Using the platform

- Follow the on-screen instructions to view or update information.
- Use search and filters, when available, to find items.
- Save or submit your work when prompted, and check for a confirmation.
- Sign out when using a shared device.

Available features depend on your account permissions and your organization’s configuration. For help, contact your administrator or support team.


## Xedruo deployment ownership map

The holding platform and operating products are deployed independently. The GitHub repository is the source of truth; the matching Vercel project is the production deployment target.

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

The legacy SpaceTruo, Healthruo and Properties Vercel projects are frozen and must not receive product deployments. The platform routes users directly to the matching standalone production projects. Keep the old project records only for historical compatibility until any legacy custom-domain or bookmark migration is explicitly approved. Do not use the legacy projects as application build targets or store product code in the holding platform.

## Release workflow

1. Make product changes in that product's repository, not in the holding-platform repository.
2. Run the repository's checks and review the change.
3. Merge approved changes to the repository's main branch.
4. Vercel deploys the matching project from that repository; verify the production deployment and product URL.
5. Keep shared identity/database migrations in the dedicated Xedruo database repository and apply them only after compatibility review against the shared Supabase project.
6. Never delete legacy data, credentials, domains, or compatibility routes until their replacement has passed production smoke tests.
