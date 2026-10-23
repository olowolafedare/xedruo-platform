// Single source of truth for "which origin should auth flows return to".
// - On localhost / 127.0.0.1 / 0.0.0.0 we stay on the local origin so dev works locally.
// - Everywhere else we use the production origin (unchanged behaviour).
export const PRODUCTION_ORIGIN = 'https://xedruo-platform.vercel.app';

export const isLocalHost = () =>
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(window.location.hostname);

export const appOrigin = () => (isLocalHost() ? window.location.origin : PRODUCTION_ORIGIN);

export const appUrl = (path = '/') => new URL(path, appOrigin()).toString();
