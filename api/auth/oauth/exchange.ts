// Explicit route for the nested OAuth exchange endpoint.
// Reuse the central auth gateway handler so validation and session issuance
// remain identical to the catch-all route.
export { default } from "../[...path]";
