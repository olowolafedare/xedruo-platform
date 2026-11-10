// Explicit Vercel entrypoint for the central Google OAuth start route.
// Keep all validation, PKCE handling and redirects in the shared auth handler.
export { default } from "../../auth/[...path].js";
