# Moving xedruo-platform from Vercel to Cloudflare Workers

The Worker (`worker/index.ts`) serves the Vite SPA from `dist/` and routes `/api/auth/*`,
`/api/admin/auth/*` and `/api/media` to the existing handlers. The Vercel entrypoints are
unchanged, so both targets keep working until you cut over.

## 1. Install and set secrets
```
npm install          # installs wrangler and updates package-lock.json
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler secret put XEDRUO_SESSION_SIGNING_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put XEDRUO_ADMIN_BOOTSTRAP_EMAIL
npx wrangler secret put XEDRUO_ADMIN_BOOTSTRAP_PASSWORD_HASH
npx wrangler secret put XEDRUO_ADMIN_BOOTSTRAP_ROLE
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY     # media route
npx wrangler secret put R2_ACCOUNT_ID                # media route
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```
Copy the values from the Vercel project's environment variables. `VITE_*` variables are
baked in at build time, so put them in `.env.production` (or the build environment)
before `npm run cf:deploy`.

## 2. Test on workers.dev before touching the domain
```
npm run cf:deploy
curl.exe -i https://xedruo-platform.<your-subdomain>.workers.dev/api/auth/health
curl.exe -i -X OPTIONS "https://xedruo-platform.<your-subdomain>.workers.dev/api/auth/session/validate" -H "Origin: https://xedrion-ai.olowolafedare39.workers.dev" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,content-type"
```
Expect `{"ok":true,...}` and a `204` with `access-control-allow-origin`. Google sign-in only
works on `xedruo.com` (the redirect URI is pinned to it), so test that after cutover.

## 3. Cut over xedruo.com
1. Cloudflare dashboard -> DNS: delete the existing `xedruo.com` record that points at Vercel.
2. Uncomment `routes` in `wrangler.jsonc` and run `npm run cf:deploy`
   (or Workers & Pages -> xedruo-platform -> Settings -> Domains -> Add custom domain).
3. Re-run the curl checks against `https://xedruo.com`, then sign in from Xedrion AI.
4. Rollback: remove the custom domain and re-add the DNS record pointing to Vercel.

## Not ported
Legacy Vercel-only routes `/api/auth/session`, `/refresh`, `/logout`, `/google/exchange`
and `/identity/onboarding` (the `api/auth/*.js` files). Nothing in `src/` calls them, and
the central handler already serves `session/refresh`, `session/logout` and
`identity/onboarding`.
