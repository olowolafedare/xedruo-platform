# Xedruo media foundation

Music masters are no longer coupled to Supabase Storage in the new path.

Flow:
1. Authenticated Xedruo user creates a music artist/track in Supabase.
2. `POST /api/media` verifies the Xedruo session and track ownership.
3. Xedruo returns a short-lived R2 presigned PUT URL.
4. The browser uploads the audio directly to Cloudflare R2.
5. Xedruo stores only the media metadata and provider-neutral object key in `music_media_objects`.
6. BunnyCDN can serve the same object key through `BUNNY_CDN_BASE_URL`.

Required Vercel environment variables:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `BUNNY_CDN_BASE_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Provider credentials are server-side only. Never expose R2 secret keys, Bunny management keys, LabelGrid credentials, or payment-provider secrets in browser code.

LabelGrid and payment providers remain external adapters. Xedruo's Supabase user UUID, Xedruo identity, artist, release, track, and media records remain the application source of truth.
