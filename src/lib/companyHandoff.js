// Single source of truth for "where does a user go after signing in?".
// Login, AuthCallback and IdentityOnboarding all use this so that a user who
// started from a company/product always lands on THAT product's own
// page/dashboard, never on the parent-company /management area.

const PRODUCTS = [
  { keys: ['sportruo'], origin: 'https://sportruo.vercel.app', route: '/' },
  { keys: ['pay-and-play', 'pay-bank'], origin: 'https://xedruo-pay-and-play.vercel.app', route: (k, p) => (k === 'pay-bank' || /\/pay(?:\/|$)/.test(p) ? '/pay' : '/play') },
  { keys: ['spacetruo'], origin: 'https://spacetruo-standalone.vercel.app', route: '/dashboard' },
  { keys: ['healthruo'], origin: 'https://healthruo-standalone.vercel.app', route: '/dashboard' },
  { keys: ['properties', 'xedruo-properties'], origin: 'https://xedruo-properties-standalone.vercel.app', route: (k, p) => (p.includes('/list') ? '/properties/list' : '/properties/workspace') },
  { keys: ['music', 'music-distribution', 'xedruo-music', 'distribution'], origin: 'https://xedruo-music-distribution.vercel.app', route: '/distribution' },
  // Xedrion AI only consumes handed-over tokens at /auth/sso (see xedrion app/auth/sso/page.tsx).
  { keys: ['xedrion-ai', 'xedruo-ai'], origin: 'https://xedrion-ai-xedruo-s-projects.vercel.app', route: '/' },
  { keys: ['hireuo', 'careers'], origin: 'https://hireuo.xedruo.com', route: '/auth/bridge?next=%2Fstart' },
  { keys: ['adom', 'adom-global-commerce'], origin: 'https://adom-global-commerce.vercel.app', route: '/' },
  { keys: ['logistics', 'xedruo-global-logistics'], origin: 'https://xedruo-global-logistics.vercel.app', route: '/' },
];

const norm = (v) => String(v || '').trim().toLowerCase();

// Find the product from an explicit ?company= value, else from the saved return path.
export function resolveProduct(company, destination) {
  const key = norm(company);
  const path = norm(destination).split('?')[0].split('#')[0];
  let match = PRODUCTS.find((p) => p.keys.includes(key));
  let matchedKey = key;
  if (!match) {
    // e.g. /company/healthruo, /company/sportruo/dashboard, /xedrion-ai, /distribution
    const seg = path.split('/').filter(Boolean);
    const candidates = seg[0] === 'company' ? [seg[1]] : [seg[0]];
    for (const c of candidates) {
      match = PRODUCTS.find((p) => p.keys.includes(c));
      if (match) { matchedKey = c; break; }
    }
  }
  if (!match) return null;
  const route = typeof match.route === 'function' ? match.route(matchedKey, path) : match.route;
  return { origin: match.origin, route };
}

// Hand the live session to the product and leave this app. Returns true if it redirected.
export function handoffToCompany(session, company, destination) {
  if (!session?.access_token) return false;
  const product = resolveProduct(company, destination);
  if (!product) return false;
  const expiresIn = session.expires_at
    ? Math.max(1, Math.floor(session.expires_at - Date.now() / 1000))
    : Number(session.expires_in) || 3600;
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token || '',
    token_type: session.token_type || 'bearer',
    expires_in: String(expiresIn),
  });
  const target = new URL(product.route, product.origin);
  target.hash = hash.toString();
  window.location.replace(target.toString());
  return true;
}

// Used only when there is NO product context at all (plain xedruo.com sign-in).
export const DEFAULT_DESTINATION = '/';
