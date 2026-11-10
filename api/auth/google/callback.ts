// Explicit Vercel entrypoint for the central Google OAuth callback route.
// Keep token exchange, state validation and company callback routing in the shared auth handler.
export { default } from "../../auth/[...path].js";
