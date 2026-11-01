# Central Xedruo identity: in-app registration contract

## Product requirement

A person registers and signs in inside the Xedruo company app they opened. The browser must not navigate to the Xedruo platform to complete registration. The platform is the identity authority and is called server-to-server / SDK-to-API in the background.

This is not a redirect-to-platform SSO flow.

## Required registration sequence

1. The company app collects the person's selected issuing country, phone number, and Google account confirmation.
2. Google confirmation is completed in the company app using Google Identity Services (popup / One Tap where supported). The app sends the Google ID token to the central identity API over HTTPS. The central API verifies the token signature, issuer, audience (the registered client ID for that company), expiry, and verified-email claim. Never trust a client-supplied email or a decoded-but-unverified JWT.
3. The central API creates or retrieves the central person record using a stable verified Google subject (sub) and a safe, explicit account-linking flow. Do not auto-merge legacy accounts by matching email.
4. The central API validates the selected ISO country against the E.164 phone number, sends an SMS OTP using the configured SMS provider, and verifies the code server-side. VAPID is not used to deliver SMS.
5. After both Google and phone verification succeed, the central API allocates or returns the permanent Xedruo ID. The issuing country and ID prefix are immutable.
6. The central API creates/updates only the profile for the company that initiated registration. Other companies' profiles and business data remain separate.
7. The central API writes an identity-registration event to a durable outbox. A server-side worker fans out a VAPID web-push notification to the registered notification endpoints for all enabled Xedruo company applications. The event includes only the minimum necessary data (event ID, company slug, opaque Xedruo ID, event type, timestamp); never include OTPs, phone numbers, Google tokens, or auth tokens.
8. The initiating company receives a short-lived, company-audience-bound session/assertion from the central API and continues in its own app. No platform-page redirect and no access/refresh tokens in URL query strings or fragments.

## Authentication and session rules

- Google identity confirmation and phone OTP are both required before issuing a fully authenticated session for a new registration.
- Google confirmation must happen in the originating company app; do not send the customer to a Xedruo platform page.
- Every company is registered centrally with an immutable company_slug, allowed origin(s), Google OAuth client ID(s), and notification endpoint ownership.
- Company authorization is evaluated server-side. A valid central identity alone does not grant access to another company's profile, role, balance, subscription, or records.
- Use short-lived, audience-restricted, one-time authorization codes/assertions exchanged over HTTPS; do not put bearer tokens in URLs.
- Legacy accounts are enrolled without deleting or replacing records. Linking requires proof of control of both identities. No email-only auto-linking.
- Country of identity issuance never changes when the person later moves. Residence is separate profile data.
- KYC is a separate compliance state and does not expire, delete, or reassign the central identity.

## VAPID notification model

VAPID is Web Push authentication, not an SMS gateway and not a way to deliver an OTP. The SMS provider delivers the customer's code. VAPID notifies company applications that a central identity event occurred.

Each company app must register its own service-worker push subscription against the central notification API, tagged with its verified company slug and environment. The API must authenticate the registering company, encrypt subscription secrets at rest, support subscription rotation/revocation, and fan out events from a durable outbox with retry/dead-letter handling. A company must not be able to register endpoints for another company.

## Push subscription API implementation

The central migration now defines:
- `public.register_xedruo_push_subscription`: authenticated users register a browser subscription for an enabled company slug. The endpoint and Web Push key material are stored in a table with RLS enabled and direct client table access revoked.
- `public.remove_xedruo_push_subscription`: users can remove only their own endpoint for the specified company.
- Subscription rows are company-scoped and carry an active flag for delivery cleanup. The existing service worker displays notification payloads; company-specific apps should pass their own registered slug to the subscription helper.

The existing push Edge Functions predate this schema and still use direct table writes. They must be reconciled with these RPCs before this migration is applied and before push registration is switched on in production. The migration does not itself send notifications.

## Required deployment configuration

Before enabling production registration, configure and verify:
- Google Identity Services OAuth client IDs and authorized origins for every company app.
- Central Google token verification (audience allowlist).
- A real SMS provider and sender configuration in the central backend; never store provider secrets in frontend code.
- VAPID public/private key pair in the central backend and push subscription storage.
- Allowed company origins, company audience mapping, and short-lived code exchange.
- Rate limits, OTP expiry, attempt limits, replay protection, audit events, and account recovery.
- Staging end-to-end tests for each company before enabling the flow in production.

## Rollout scope

Integrate the same in-app registration contract into Xedruo, Xedrion AI, Sportruo, Healthruo, SpaceTruo, Hireuo, Xedruo Properties, Xedruo Music, Pay & Play, Adom Global Commerce, and Xedruo Global Logistics. Supabase-authenticated apps and Convex-authenticated apps must use the same central identity API; Convex records and existing IDs must be preserved during migration.

## Important implementation status

This document defines the required architecture. It does not itself configure Google OAuth clients, an SMS provider, VAPID secrets, company origins, deploy edge functions, or migrate each company's authentication code. Those integrations must be implemented and tested before claiming the ecosystem rollout is complete.
