# DataTalk V2.0.0-rc.1 - deployment runbook

**Release candidate, not a production deployment.** This full-source distribution incorporates the supplied backend 1.3.5 and dashboard 1.4.0. It implements the account/workspace/permissions foundation. It is not a completed analytics, native-mobile or AI V2 release.

No remote repository, Supabase configuration, Google configuration, live user, or production deployment was changed while preparing this package. The SQL below has NOT been executed against PostgreSQL in this environment.

## 1. Preserve the existing product

Work on a new Git branch and a separate staging database first. Do not push to an auto-deploy production branch until the release gates below pass. Export/backup the database, policies, grants, Auth configuration and the current source. Record event/project/account counts and current deployment IDs. Verify that backups can actually be restored.

This is the **FULL SOURCE** distribution, already merged with the original MVP. No overlay application, Python command, or manual patch merging is needed.

Open the backend or frontend folder and upload its CONTENTS to the corresponding repository root, where `package.json` already lives. Do not upload the ZIP itself or nest the whole outer folder inside your repository. Start on a separate `release/v2-gd01` branch. Keep an existing `.git` directory and local secret files; do not publish them. These sources match the supplied MVP ZIPs plus the reviewed upgrade, not any unknown later commits in your repository.

Follow `UPLOAD_GITHUB.md` for the upload sequence. Database and authentication configuration still require explicit, one-time setup outside Git. No code upload runs these SQL scripts automatically. The full-source ZIP excludes dependency folders, build caches, private environment files and font binaries. CSS uses locally available Poppins or its system fallback; it does not fetch missing font files. No application feature or flow was redesigned during packaging.

## 2. Role model

There are two different scopes. `public.users.role` is the **platform role**; `workspace_members.role` is the role in **one workspace**.

| Scope / role | Implemented permission |
| --- | --- |
| SUPER_ADMIN (platform) | List/search activated DataTalk accounts, suspend/reactivate ordinary accounts, read account/permission audit records. Does not automatically read every customer's analytics. |
| USER (platform) | Use workspaces to which the verified user belongs. A new user gets a private, owned workspace. |
| OWNER (workspace) | Create/view projects; invite ADMIN/EDITOR/VIEWER; change/remove non-owner members. |
| ADMIN (workspace) | Create/view projects; invite and manage EDITOR/VIEWER. Cannot grant ADMIN, modify another ADMIN or modify OWNER. |
| EDITOR (workspace) | View data and create projects. No membership management. |
| VIEWER (workspace) | View workspace data. Cannot create projects or manage members. |

A user's role in workspace A has no effect on workspace B. This version does not implement ownership transfer, multiple platform-admin grants from the UI, custom permissions, billing roles, password administration or deletion of accounts. A Super Admin who also owns a workspace has OWNER permissions there through membership, not through a hidden global bypass.

## 3. Database preparation - stop on unexplained differences

Use `database/v2/` in the backend repository in this order:

1. **`000_preflight_READ_ONLY.sql`**: inventory existing columns, constraints, roles, owner memberships, public policies/views/functions and the expected Auth identity. Save results. This script changes nothing. Stop if essential V1 tables/columns are missing, case-insensitive duplicate emails exist, or orphaned projects/ownerless workspaces need repair. Never assign historical projects to an arbitrary new user.
2. Review differences from the supplied `database/schema.sql` and the existing V1 reconciliation migration. On a blank staging project, apply the original V1 schema first. Do not blindly rerun old schema scripts on production. Review custom policies, views and security-definer functions; the V2 migration handles only the known DataTalk objects.
3. **`001_accounts_and_permissions.sql`**: apply on staging. Creates invitation storage and server-only transactional permission functions. Converts legacy *platform* OWNER/ADMIN to USER; *workspace* USER to EDITOR; repairs actual workspace-owner membership. Changes the default member role to VIEWER. Does not delete event, project, session or user records.
4. **`004_security_STAGING_ROLLBACK.sql`**: execute on staging. It creates temporary fixtures inside a transaction, tests actual SQL permissions, and ends in ROLLBACK. It is NOT read-only and has not been run here. Any exception is a release blocker. If the editor stops on error, explicitly ROLLBACK before continuing.
5. **`003_verify_READ_ONLY.sql`**: check RLS, grants, RPC privileges and preserved data counts.

### Authorization boundary

This candidate deliberately uses an **API-only data access model**: the browser uses Supabase for authentication, then calls the Fastify API with the Supabase access token. Browser roles `anon` and `authenticated` cannot read or mutate DataTalk tables or call privileged DataTalk RPCs. RLS is enabled, browser table privileges are revoked (including inherited PUBLIC grants), and restrictive deny policies protect the known tables.

The backend's service key is privileged. The backend verifies the token with Supabase Auth and checks active profile status and workspace membership. Transactional writes recheck authorization inside server-only SQL functions and write an audit record. A function argument such as `p_actor` is safe only because untrusted browser roles cannot execute these functions.

**Important compatibility change:** direct browser `supabase.from(...)` queries or Realtime subscriptions to these tables will not work under this boundary. A separate permission design is needed before introducing those features. Existing unknown security-definer functions/views can bypass table RLS; review preflight results, do not assume this migration secures unrelated objects.

## 4. Bootstrap the existing Super Admin safely

The intended identity, taken from the supplied Auth screenshot, is:

```text
Email: khoa3815@gmail.com
Auth UUID: 1bc0d1b0-4de3-4243-964a-cf49aafee38c
```

Confirm BOTH values in Supabase Authentication > Users. The screenshot establishes that an account is listed, not that it has a verified email, a known password or a DataTalk platform role.

After migration 001, execute **`002_bootstrap_super_admin.sql`** from a trusted SQL editor. The script requires an existing Auth user with the exact UUID, exact normalized email and a non-null `email_confirmed_at`. It stops on a mismatch. It does not create a password, auto-confirm ownership, or alter authentication credentials. It creates/updates the DataTalk profile and private workspace, then grants the platform role and records the change.

If the account cannot sign in, use the account's legitimate password recovery / email confirmation process after configuring Auth email delivery. Do not create another same-email account or copy a role into editable `user_metadata`. Do not change the SQL guard simply to bypass a verification failure.

`SUPER_ADMIN_EMAIL` is no longer a grant mechanism. `SUPER_ADMIN_USER_ID` in the backend environment only identifies the private trial owner and does NOT grant a role. Further Super Admin grants require a separately reviewed trusted database action; the web UI cannot escalate a user into this role.

## 5. Backend configuration (Render)

Use Node 22 (the package engine is `>=22 <23`). Start command is **`npm start`**, which now runs `src/start.js`; do not retain `node src/server.js` as a custom start command.

```dotenv
SUPABASE_URL=https://qkurxrfmcmonajodnnnx.supabase.co
SUPABASE_SERVICE_KEY=<server-side service_role key>
PUBLIC_API_URL=https://datatalk-api-h4a1.onrender.com
CORS_ORIGINS=https://datatalk-dashboard-qli5.vercel.app
SUPER_ADMIN_USER_ID=1bc0d1b0-4de3-4243-964a-cf49aafee38c
ENABLE_TRIAL_SANDBOX=false
PORT=10000
NODE_ENV=production
TRUST_PROXY_HOPS=1
```

`SUPABASE_SECRET_KEY` is accepted as an alternative server secret; use one intended key, not conflicting values. Store secrets in Render environment settings, never Git or the frontend. Add only explicit, trusted staging frontend origins when needed. Confirm proxy-hop configuration matches the actual hosting topology; it affects IP rate limiting.

Readiness route: `/health/ready` checks DB access and an expected V2 table. `/health` is process liveness only. A green liveness response is not an authentication or full schema test. `/health/ready` should return 503 if the V2 table/data service is unavailable.

The public collector endpoints need cross-origin requests from tracked websites, but a public tracking key is never permission to read projects or analytics. Origin checks on collection reduce accidental cross-site use; they are not cryptographic proof that an event came from a real user. Do not market collected events as tamper-proof.

## 6. Frontend configuration (Vercel)

Retain project **datatalk-dashboard-qli5**. Do not delete or repoint the other Vercel project as part of this release.

```dotenv
NEXT_PUBLIC_API_URL=https://datatalk-api-h4a1.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://qkurxrfmcmonajodnnnx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<public publishable key or legacy anon key>
```

A legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported. Never put a service_role key, Supabase secret or Google Client Secret in any `NEXT_PUBLIC_` variable. Vercel public variables are build-time configuration: rebuild after changing them.

Install dependencies and run the release checks in a connected environment:

```sh
# Backend repository
npm install
npm test

# Frontend repository
npm install
npm test
npm run check:syntax
npm run typecheck
npm run build
```

The original Next/React dependency versions were retained; this repack is not a dependency modernization or vulnerability certification. Review `npm audit`, resolve high-impact findings before production, and commit the generated lockfiles after successful installation/build. No lockfile was fabricated here because registry access failed.

## 7. Supabase Auth + Google + email

### Supabase URL settings

Site URL:

```text
https://datatalk-dashboard-qli5.vercel.app
```

The code uses these callback routes; configure the allowed redirects for the routes you expose, including the query variants actually sent by the form:

```text
https://datatalk-dashboard-qli5.vercel.app/auth/callback
https://datatalk-dashboard-qli5.vercel.app/auth/callback?next=%2Fdashboard
https://datatalk-dashboard-qli5.vercel.app/auth/callback?next=%2Fprojects
https://datatalk-dashboard-qli5.vercel.app/auth/callback?next=%2Fsettings%2Fmembers
https://datatalk-dashboard-qli5.vercel.app/auth/callback?next=%2Freset-password
https://datatalk-dashboard-qli5.vercel.app/auth/callback?next=/reset-password
```

Use precise production destinations, not an unrestricted wildcard domain. Check the actual `redirect_to` in a staging sign-in, because existing URL and email-template configuration has not been inspected. For custom confirmation/recovery templates, retain Supabase's generated `{{ .ConfirmationURL }}` flow; a previous SSR `token_hash` template must be adapted instead of pointing to an unimplemented route.

This client uses PKCE. `/auth/callback` passes the auth code to `/auth/complete`; the browser that initiated the request exchanges it using its stored verifier. Open email links in that same browser. Cross-device confirmation may confirm the email without completing this browser session; then sign in normally. For recovery, request a fresh link in the browser in which you will set the password. Do not claim a callback reload or reused code is supported.

### Google provider

In Google Cloud / Google Auth Platform, configure a Web application OAuth client and the appropriate audience/consent screen. Add the frontend origin as an authorized JavaScript origin. The **Google authorized redirect URI is Supabase's callback, not the frontend callback**:

```text
https://qkurxrfmcmonajodnnnx.supabase.co/auth/v1/callback
```

Store the Client ID and Client Secret in Supabase Authentication > Sign In / Providers > Google and enable the provider. Never commit the secret. Test with authorized test accounts before changing the app audience to allow public use. For the existing admin, verify the resulting Supabase UUID after a Google login; do not create a duplicate profile based on email matching in the application.

### Email/password and recovery

Enable email signups and require email confirmation. Set a matching server-side password policy (the form requests at least 12 characters; client validation alone is not enforcement). Configure and test **custom SMTP** before public signups. Supabase's default delivery is restricted and is not a production signup email service. Test delivery, spam placement, expiry and password recovery with a non-team external email.

Membership invitations in this version are **in-app only**. Creating one returns `email_sent:false`. The inviter shares the registration link manually. The teammate verifies the exact invited email, signs in, opens Members & roles, and accepts. Invitations expire after seven days. They are not equivalent to Supabase's account-invitation email. Adding automated membership emails is a separate feature.

## 8. Mandatory acceptance tests before public access

Use at least two ordinary accounts A/B plus the intended Super Admin in separate browser profiles. Use staging-only accounts and domains, not customer secrets.

| Test | Required outcome |
| --- | --- |
| Signup / confirm / login / recovery | All complete using real email delivery; expired/reused/cross-browser links fail intelligibly. |
| Google login | Session returns to the chosen frontend and creates/reuses the correct UUID/profile. |
| First account load | One personal workspace is created, including after two parallel bootstrap requests. |
| Tenant isolation | B cannot list, fetch, read analytics or mutate A's workspace/project by changing IDs or request bodies. |
| Forged client role | Changing local storage, user_metadata, request role or email does not grant platform privileges. |
| Direct Supabase calls | Public/anon/authenticated clients cannot read or write DataTalk tables or call privileged RPCs. |
| Invitation | Wrong-email, expired, revoked and stale-inviter invitations are rejected; acceptance does not overwrite an existing OWNER. |
| Role changes | VIEWER cannot create; EDITOR cannot manage members; ADMIN cannot create ADMIN or change OWNER. |
| Suspension | A suspended ordinary account's subsequent protected API calls are rejected, including an already-open browser. |
| Owner/admin protection | No self-lockout, OWNER removal, or web-based SUPER_ADMIN grant. |
| Workspace/project switches | No stale account data flashes between scopes; revoked membership errors are handled. |
| Tracking verification | A valid key alone does not mark connected; a real collected event does. Wrong domain is rejected as configured. |
| Demo separation | Empty new account shows no fabricated historical metrics; shared sandbox stays disabled. |
| Operational | Readiness, CORS, logs, rate limits, DB grants, audit records, backups and browser/mobile layout reviewed. |

Run `scripts/security-smoke.mjs` with locally supplied staging tokens for a read-only subset of API checks; see the source header for environment names. Do not paste these tokens into chat or commit them. This script is not a penetration test or substitute for the table above.

## 9. Cutover and rollback

After staging is accepted, schedule a controlled production cutover. Pause new mutations / account access while permissions and application versions are out of sync. Apply reviewed migration 001, bootstrap/verify the intended admin, deploy backend V2, deploy the matching frontend, then smoke-test before reopening signups. Track error rates and failed authorization attempts.

The migration preserves data but changes role constraints and browser privileges. **Do not roll back only the frontend/backend to the old V1 auth implementation while keeping V2 DB assumptions, and do not re-enable the old email-based promotion.** On a failed cutover, keep access restricted, fix forward or restore the reviewed coordinated application+database backup. A source backup is not a database backup. No destructive automatic down-migration is included.

## 10. Scope still outside this release

The candidate wires account data into the main dashboard and preserves the project's navigation/wizard intent. Some demo-only pages are now explicitly unavailable for live data instead of displaying invented metrics. This is a deliberate data-trust tradeoff, not a full visual redesign validated against Figma.

Remaining work: full Next build/type/browser QA and live Auth/SQL tests; direct Figma comparison; richer heatmap overlay and session replay; working real-data funnels; full-history/time-range analytics; native mobile SDK; verified UX-law/LLM advisory; project editing/deletion; automatic member emails; ownership transfer; admin MFA; configurable retention/deletion/consent and PII redaction; collector integrity/SDK lifecycle review; load testing, monitoring and abuse controls. Do not open tracking to sensitive customer traffic without that privacy review.

The inherited SDK/heuristics are not a guarantee of friction causality. Main analytics uses at most the latest 1,000 events, and feedback/session results are bounded. Heatmaps currently show a coordinate sample, not a page overlay; sessions are metadata, not a replay recording. AI suggestions are rule-based, not a model-backed design audit. Suspending an account blocks its protected API access; it does not erase Auth sessions, historical data, or stop the public collector for an entire shared workspace.

## Official references checked for this implementation

- Supabase Google Auth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase PKCE: https://supabase.com/docs/guides/auth/sessions/pkce-flow
- Supabase SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase verified getUser: https://supabase.com/docs/reference/javascript/auth-getuser
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

Reference date: 2026-09-19. Actual dashboard configuration and production connectivity were not verified during packaging. Repack: full.1. See PACKAGING_REPORT.md for the fresh local check results.
