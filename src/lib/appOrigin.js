// Resolve authentication callbacks against the app that initiated sign-in.
// Xedruo products share an identity provider, but each product must return
// users to its own host (for example, spacetruo.vercel.app or healthruo.vercel.app).
// Using a single parent-company origin here sends every product back to xedruo.com.
export const PRODUCTION_ORIGIN = 'https://xedruo.com';

export const isLocalHost = () =>
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(window.location.hostname);

export const appOrigin = () =>
  typeof window !== 'undefined' ? window.location.origin : PRODUCTION_ORIGIN;

export const appUrl = (path = '/') => new URL(path, appOrigin()).toString();
