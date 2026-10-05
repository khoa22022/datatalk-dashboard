> Historical MVP instructions only. For V2 use README.md and V2_DEPLOY.md in the repository root. Do not apply old account/permission instructions to V2.

# Datatalk Backend v1.3.3

Hotfix for Trial Tracking Sandbox POST requests.

## Fix
The production Vercel dashboard origin is explicitly allowed by the CORS policy. This fixes browser preflight failures for JSON POST requests from the Trial Sandbox while preserving configured CORS origins and localhost development origins.

No database schema or tracking payload changes are included.

## Verification
- CORS policy regression test passes.
- Node syntax checks pass for server and CORS policy.
