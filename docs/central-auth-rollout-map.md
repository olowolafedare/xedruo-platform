# Central authentication rollout map

This file records the verified central registry identifiers and Neon database targets. It is a rollout reference, not evidence that the company applications have already integrated central authentication.

## Production company registry

| Application | Central company slug | Exact registered callback |
|---|---|---|
| Xedrion AI | `xedrion-ai` | `https://xedrion-ai.vercel.app/auth/finish` |
| Pay and Play | `pay-and-play` | `https://xedruo-pay-and-play.vercel.app/auth/callback` |
| Music Distribution | `xedruo-music` | `https://xedruo-music-distribution.vercel.app/auth/callback` |
| Careers | `hireuo` | `https://xedruo-careers.vercel.app/auth/callback` |
| Adom Global Commerce | `adom-global-commerce` | `https://adom-global-commerce.vercel.app/auth/callback` |

Use the exact slug and callback above in each app's auth-client configuration. Do not substitute a generic `/auth/callback` for Xedrion AI: its registered callback is `/auth/finish`.

## Neon database targets

| Application | Neon project | Production branch | Database |
|---|---|---|---|
| Xedruo Platform | `solitary-grass-19539960` | `br-red-bonus-bat7j83a` | `xedruo_platform_db` |
| Xedrion AI | `green-credit-07667632` | `br-billowing-silence-b9g56qaw` | `xedrion_ai_db` |
| Pay and Play | `broad-moon-67756679` | `br-aged-silence-b9g3j420` | `xedruo_pay_and_play_db` |
| Music Distribution | `aged-surf-78271806` | `br-jolly-waterfall-b9vm8427` | `xedruo_music_distribution_db` |
| Careers | `delicate-dawn-48722462` | `br-silent-star-b9drnvkk` | `xedruo_career_db` |
| Adom Global Commerce | `curly-dust-04395578` | `br-small-king-bawglqps` | `adom_global_commerce_db` |

## Verified state on 2026-11-09

- Central platform database contains 13 public authentication tables.
- The five company databases exist but currently contain no public tables.
- The central registry contains 11 enabled company entries; the five production app callbacks above were read from the live registry.
- The central identity and account tables currently contain no migrated customer rows.
- All six latest Vercel production deployments reported `READY`; that status is a build/deployment status only, not a successful login test.

## Required before production cutover

1. Integrate the auth client into each of the five company apps with the exact slug/callback above.
2. Implement server-side session storage (prefer secure, HttpOnly cookies over browser-readable token storage).
3. Create each company's own schema from its current application data model and migrate records with counts/reconciliation.
4. Add company API authorization, admin permissions, and audit logging.
5. Test registration, Google OAuth, phone onboarding, session refresh/revocation, dashboard access, and account recovery on every production origin.
6. Only then remove old authentication dependencies and cut over production traffic.

Do not treat this rollout map or the shared client PR as completion of those steps.
