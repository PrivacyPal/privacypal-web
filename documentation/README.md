# PrivacyPal Documentation

## API Specifications

### Main API (api.privacypal.ai)

**OpenAPI Spec:** `sdk/openapi.yaml`

The main PrivacyPal API serves encoding, decoding, AI chat, user management, and company features. This is what the SDK (`@privacypal/sdk` / `privacypal-sdk`) connects to.

**Base URL:** `https://api.privacypal.ai`

**Key paths:**
- `/health` — Health check (no auth)
- `/api/user/login`, `/api/user/register`, `/api/user/refresh-token` — Auth (no auth)
- `/api/scanner/encode`, `/api/scanner/encode/batch`, `/api/scanner/encode/file` — Encoding
- `/api/scanner/decode` — Decoding
- `/api/scanner/twins/{continuationId}` — Dataset twins
- `/api/ai/chat`, `/api/ai/chat/stream`, `/api/ai/providers` — AI chat
- `/api/user/account`, `/api/user/stats`, `/api/user/usage` — Account
- `/api/company`, `/api/company/invite`, `/api/company/audit-logs/update-tokens` — Company

### Ops Runtime API (on-premises / edge)

**OpenAPI Spec:** `ops-runtime-openapi.yaml`

The Ops Runtime API is used for on-premises and edge deployments. It provides user management, cloud/vault configuration, public figures checks, OAuth, and Stripe billing.

**Base URL:** Varies by deployment (e.g., `https://ops.privacypal.ai` or custom)

**Key paths:**
- `/api/user/*` — User registration, login, account, usage, subscription
- `/api/cloud/*` — Vaults, connections, data catalog, data ID models, license
- `/api/public-figures/*` — Public figures list and name checks
- `/api/auth/*` — Google/Microsoft OAuth
- `/api/stripe/*` — Stripe webhook, config, payment, subscription

## SDK Documentation

- **Node.js:** `@privacypal/sdk` — See `sdk-documentation.md` in the project root
- **Python:** `privacypal-sdk` — Mirrors the Node.js API; use `prompt` (not `message`) for `chat_with_ai`
- **Web docs:** `sdk/index.html` — Getting started and API reference (Stoplight Elements)
