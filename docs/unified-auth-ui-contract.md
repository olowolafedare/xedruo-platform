# Unified Xedruo company authentication UI contract

This is the canonical customer authentication experience for every standalone Xedruo company. Company apps remain independently hosted and own their own callback and dashboard. They use the Xedruo central authentication API; they must not send customers to the Xedruo holding-platform UI.

## Shared entry screen

- Heading: **Get started**
- Present two clear actions: **Login** and **Create account**.
- Both actions use the same central Google authentication flow. The central identity service determines whether the Google identity already exists; the UI must not create duplicate accounts.
- Keep the same component hierarchy, responsive behavior, spacing, typography, input treatment, loading state, validation state, and error treatment in every company.
- Company logo/name and a restrained brand accent may vary. The layout and interaction must not vary by company.

## Existing users

- Authenticate with the Google identity already linked to their Xedruo account.
- Do not ask for country selection.
- Do not ask for a phone number again when the central identity already contains one.
- Do not show phone OTP/SMS verification.
- After central session validation, return the user to the same company's own dashboard or the safe in-company return path.

## New users only

After Google authentication, if the central API returns `onboarding_required`, show the shared onboarding screen and collect:
1. Full legal name.
2. Country selection (use the complete central country/calling-code list).
3. Phone number, displayed separately from the selected country's calling code.

Phone number is mandatory to issue a Xedruo ID. Country selection is only part of first-time identity onboarding, never an existing-user login form. The phone number is collected but is not verified by SMS or OTP. Never call an SMS provider or ask for a phone verification code.

After successful onboarding, the central API issues the user's Xedruo identity and the app returns the user to its own dashboard.

## API and session requirements

- Use the central Xedruo authentication API for Google sign-in, OAuth exchange, session validation, refresh, logout, and identity onboarding.
- Send the registered company slug on every request.
- Keep OAuth callback URLs and company origins tied to verified production deployment domains.
- Do not redirect users to the Xedruo platform to complete ordinary customer login.
- A company may render an error from the central API, but must not disguise an HTTP/API failure as a generic network failure.
- Never hardcode, guess, or invent a company production URL.

## Shared design acceptance checklist

- [ ] Same "Get started" title and Login/Create account actions.
- [ ] Same Google sign-in button placement and visual treatment.
- [ ] Same form widths, labels, spacing, button heights, typography, focus states, and mobile layout.
- [ ] Same loading, empty, success, and error states.
- [ ] Existing users see no country selector, phone collection, or OTP step.
- [ ] New users see legal name, full country list, separate calling code, and phone number.
- [ ] No SMS/OTP verification step exists in UI, API flow, or database onboarding rules.
- [ ] Successful authentication returns to the originating company app, never the holding platform.
- [ ] Preserve existing company dashboards and native Android behavior while updating web auth.
