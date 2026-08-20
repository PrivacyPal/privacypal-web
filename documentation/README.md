# PrivacyPal Documentation

## SDKs

- **Node.js:** `@privacypal/sdk` v1.0.2. Node.js 18+, ES Modules, TypeScript types included. Full reference in `sdk-documentation.md` in the project root.
- **Python:** `privacypal-sdk` v1.0.2. Python 3.10+, sync API on `requests`. Mirrors the Node.js surface; use `prompt` (not `message`) for `chat_with_ai`. Typed exceptions (`PrivacyPalError` base with `status_code`; `AuthenticationError`, `TrialExpiredError`, `NetworkError`, `RequestError`). No streaming chat yet (Node.js only).
- **Web docs:** `sdk/index.html`. Developer quickstart, guides, what's new, and API reference (Stoplight Elements).

Both SDKs support user JWTs, provisioned developer keys (`x-pp-developer-key`), and optional client IDs (`x-pp-client-id`). The Python SDK additionally supports entitlement leases (`x-pp-entitlement-lease`) for on-device deployments.

## API Specifications

### Main API (api.privacypal.ai) · v1.4.4

**OpenAPI Spec:** `sdk/openapi.yaml`

The main PrivacyPal API serves encoding, decoding, AI chat, Private Memory, user management, and company features. This is what the SDK (`@privacypal/sdk` / `privacypal-sdk`) connects to.

**Base URLs:**
- `https://api.privacypal.ai` (enterprise plane: Pro / Max / Cloud / SDK)
- `https://api.family.privacypal.ai` (PrivacyPal Family plane: same API, fully isolated credentials; tokens are not valid across planes)

**Key paths:**
- `/health`: Health check (no auth)
- `/api/user/login`, `/api/user/register`, `/api/user/refresh-token`: Auth (no auth)
- `/api/scanner/encode`, `/api/scanner/encode/batch`, `/api/scanner/encode/file`: Encoding
- `/api/scanner/decode`: Decoding
- `/api/scanner/twins/{continuationId}`: Dataset twins
- `/api/ai/chat`, `/api/ai/chat/stream`, `/api/ai/providers`: AI chat
- `/api/memory/*`: Private Memory (episodes, recall, stats, settings, audit, export, crypto-shred erase)
- `/api/user/account`, `/api/user/stats`, `/api/user/usage`: Account
- `/api/company`, `/api/company/invite`, `/api/company/audit-logs/update-tokens`: Company

**Detection profiles:** detection policy is resolved server-side from the authenticated account. Family accounts automatically get the `family` profile (adds a `SCHOOL` entity and city-level geography protection); enterprise accounts get `standard`. There is no client parameter for this, by design.

### Family Platform API (family.privacypal.ai)

**OpenAPI Spec:** `family/openapi.yaml`

The consumer household platform behind PrivacyPal Family: households, members, age stages, guardrails, never-share list, devices, signals-only telemetry, alerts, approvals, wellbeing, digests, and billing ($9.99/mo, 5-day trial, up to 5 household devices). All routes live under `/api/family`.

**Auth model:** parents hold a family session (httpOnly cookie or bearer token); kids sign in with a Family Code plus optional PIN and never hold an email or password; registered devices use `x-pp-device-token`; partner JWTs get read-only aggregate admin endpoints only. Members reach the Family data plane via short-lived member tokens from the device member-token exchange.

Family identity is fully isolated from enterprise accounts: no Family credential or email ever enters the shared product graph.

### Ops Runtime API (on-premises / edge)

**OpenAPI Spec:** `ops-runtime-openapi.yaml`

The Ops Runtime API is used for on-premises and edge deployments. It provides user management, cloud/vault configuration, public figures checks, OAuth, and Stripe billing.

**Base URL:** Varies by deployment (e.g., `https://ops.privacypal.ai` or custom)

**Key paths:**
- `/api/user/*`: User registration, login, account, usage, subscription
- `/api/cloud/*`: Vaults, connections, data catalog, data ID models, license
- `/api/public-figures/*`: Public figures list and name checks
- `/api/auth/*`: Google/Microsoft OAuth
- `/api/stripe/*`: Stripe webhook, config, payment, subscription
