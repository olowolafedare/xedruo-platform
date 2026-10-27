// Single source of truth for the origin used by Xedruo authentication callbacks.
// Use the official custom domain: Vercel deployment URLs may be protected by
// team SSO and can send users to a holding/login screen instead of the app.
// Local development remains on its local origin.
export const PRODUCTION_ORIGIN = 'https://xedruo.com';

export const isLocalHost = () =>
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(window.location.hostname);

export const appOrigin = () => (isLocalHost() ? window.location.origin : PRODUCTION_ORIGIN);

export const appUrl = (path = '/') => new URL(path, appOrigin()).toString();
