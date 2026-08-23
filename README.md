# Xedruo Group Holdings

Independent 15-company platform migrated from Base44 to GitHub + Vercel + Supabase.

## Production

- Frontend: Vercel
- Source: GitHub
- Backend/Auth: Supabase
- Production URL: https://xedruo-platform.vercel.app

## Architecture

Xedruo Group Holdings is the parent company overseeing the 14 operating companies. Each company is designed for its own dashboard, access boundary, route, and future custom domain.

## Development

```bash
npm install
npm run dev
npm run build
```

## Authentication

Google OAuth is handled through Supabase Auth. Production redirect URLs must be registered in Supabase and Google Cloud before enabling the provider in production.
