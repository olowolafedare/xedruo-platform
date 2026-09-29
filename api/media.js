import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ydhgxyklucrcqmivtvcu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || 'xedruo-media';
const BUNNY_CDN_BASE_URL = String(process.env.BUNNY_CDN_BASE_URL || '').replace(/\/$/, '');

const encode = (value) => encodeURIComponent(value).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const hmac = (key, value) => crypto.createHmac('sha256', key).update(value).digest();

function signingKey(secret, date, region, service) {
  const kDate = hmac(Buffer.from('AWS4' + secret), date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function presignPutUrl({ key, contentType, expires = 900 }) {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new Error('R2 storage is not configured');
  const region = 'auto';
  const service = 's3';
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const credential = `${R2_ACCESS_KEY_ID}/${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalUri = `/${encode(R2_BUCKET)}/${key.split('/').map(encode).join('/')}`;
  const params = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
  });
  const canonicalQuery = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${encode(k)}=${encode(v)}`).join('&');
  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = ['PUT', canonicalUri, canonicalQuery, canonicalHeaders, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');
  const signature = crypto.createHmac('sha256', signingKey(R2_SECRET_ACCESS_KEY, dateStamp, region, service)).update(stringToSign).digest('hex');
  params.set('X-Amz-Signature', signature);
  const uploadUrl = `https://${host}${canonicalUri}?${params.toString()}`;
  const cdnUrl = BUNNY_CDN_BASE_URL ? `${BUNNY_CDN_BASE_URL}/${key.split('/').map(encode).join('/')}` : null;
  return { uploadUrl, cdnUrl, key, bucket: R2_BUCKET, expiresIn: expires, contentType };
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!SUPABASE_KEY) return json(res, 500, { error: 'Supabase server configuration is missing' });

  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return json(res, 401, { error: 'Authentication required' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json(res, 401, { error: 'Invalid session' });

  const body = req.body || {};
  const trackId = String(body.trackId || '');
  const fileName = String(body.fileName || 'audio');
  const contentType = String(body.contentType || 'audio/mpeg');
  if (!trackId) return json(res, 400, { error: 'trackId is required' });
  if (!/^audio\/(mpeg|wav|x-wav|flac|mp4|aac|ogg|webm)$/.test(contentType)) return json(res, 400, { error: 'Unsupported audio content type' });

  const { data: track, error: trackError } = await supabase.from('music_tracks').select('id,artist_id,music_artists!inner(user_id)').eq('id', trackId).maybeSingle();
  if (trackError || !track || track.music_artists?.user_id !== user.id) return json(res, 403, { error: 'Track does not belong to the authenticated Xedruo account' });

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160) || 'audio';
  const key = `${user.id}/music/${trackId}/${crypto.randomUUID()}-${safeName}`;
  try {
    return json(res, 200, presignPutUrl({ key, contentType }));
  } catch (error) {
    return json(res, 503, { error: error.message || 'R2 storage is unavailable' });
  }
}
