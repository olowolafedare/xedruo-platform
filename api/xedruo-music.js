export default async function handler(req, res) {
  const apiKey = req.headers['x-xedruo-api-key'];
  const expected = process.env.XEDRUO_PARTNER_API_KEY;
  if (!expected || apiKey !== expected) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET' && req.query?.health === '1') return res.status(200).json({ service: 'xedruo-music-api', status: 'ok' });

  const provider = String(req.query?.provider || 'xedruo').toLowerCase();
  const urls = {
    xedruo: process.env.XEDRUO_DISTRIBUTION_API_URL,
    tunecore: process.env.TUNECORE_API_URL,
    onerpm: process.env.ONERPM_API_URL,
  };
  const base = urls[provider];
  if (!base) return res.status(400).json({ error: 'Provider not configured', provider });

  const upstreamPath = req.query?.path ? String(req.query.path) : '/catalog';
  const target = `${base.replace(/\/$/, '')}/${upstreamPath.replace(/^\//, '')}`;
  try {
    const headers = { Accept: 'application/json' };
    if (process.env[`${provider.toUpperCase()}_API_KEY`]) headers.Authorization = `Bearer ${process.env[`${provider.toUpperCase()}_API_KEY`]}`;
    const upstream = await fetch(target, { method: req.method, headers, body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {}) });
    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch (error) {
    res.status(502).json({ error: 'Music provider unavailable' });
  }
}
