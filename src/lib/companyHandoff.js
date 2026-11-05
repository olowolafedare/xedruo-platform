// Product authentication is owned by each product application.
// The platform is an administration surface, not an authentication broker.
// Never copy session tokens into URLs or navigate a user to another company app.
// Company apps must call the shared Xedruo Identity API from their own sign-in UI.

export function resolveProduct() {
  return null;
}

/**
 * Kept as a compatibility shim for older platform screens.
 * Cross-company session handoff is intentionally disabled.
 */
export function handoffToCompany() {
  return false;
}

export const DEFAULT_DESTINATION = '/';
