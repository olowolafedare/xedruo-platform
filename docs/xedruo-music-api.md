# Xedruo Music API

Xedruo Play uses one music API boundary for the Xedruo ecosystem. The API is designed to aggregate Xedruo Distribution and approved third-party distribution partners without exposing partner credentials to customers.

## Provider adapters

- `xedruo` — Xedruo Music Distribution
- `tunecore` — TuneCore partner adapter
- `onerpm` — ONErpm partner adapter

Partner adapters are configured server-side with environment variables. Credentials are never shipped to the browser.

## Core endpoints

- `/profile` — customer/artist profile and preferences
- `/catalog` — playable catalog
- `/search` — artists, releases and tracks
- `/stream` — playback authorization/stream metadata
- `/releases` — release metadata and distribution status
- `/preflight/report` — retrieve a provider-generated Preflight QC report
- `/preflight/refresh` — request a fresh Preflight QC analysis
- `/preflight/confirm-review` — confirm a release after Xedruo completes its internal review
- `/bookings` — artist booking workflows
- `/tickets` — ticket discovery and purchase workflows
- `/support` — artist support/fan-support workflows
- `/store` — artist products and commerce

## Identity

Every customer uses the same Xedruo identity and 10-digit Xedruo account number across services. Country selection determines the display/base currency for Pay & Play.

## Security

Partner API keys and provider credentials are server-side only. Customer authorization continues to be enforced by the Xedruo authentication, company membership and server-side authorization layers.

## Partner connection status

The adapter/gateway is implemented, but TuneCore and ONErpm cannot be marked live until their approved API credentials, scopes and partner endpoints are supplied/configured. The application will fail closed for an unconfigured provider.
\n\n## Preflight QC\n\nPreflight QC is an internal Xedruo release-control stage. A release remains on hold until the configured QC provider returns an analysis. Xedruo reviews flagged matches, records feedback or supporting-document references, resolves blocking issues, and only then confirms the release for distribution review. Provider credentials and provider-specific implementation remain server-side.\n