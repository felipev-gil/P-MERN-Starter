# Verification record

Verified locally on 2026-09-12 using Windows, Node 24.20.0, and pnpm 11.19.0.

## Initial README audit

| Original claim | Initial code | Resolution |
| --- | --- | --- |
| Runnable backend | Empty src/index.js; scripts targeted missing root index.js | Corrected scripts, app factory, database-first startup |
| MongoDB/Mongoose | Mongoose was not installed | User/session models, database connection, indexes |
| Authentication and validation | Dependencies and empty directories only | Cookie sessions, bcrypt, validation, protected current-user route |
| Testing | Jest dependency, no tests | Node/Supertest integration tests and focused Vitest tests |
| Upstash rate limiting | Dependencies only | Working local memory limiter; shared stores documented as optional |
| Frontend features | Blank App; unused UI/request packages | Minimal working router, forms, context, API client, health demo |
| Deployment ready / production ready | No supporting implementation or verification | Removed claims; documented configuration and limits |
| MIT | Stated in README/package metadata without a license file | Added MIT LICENSE |

## Fresh-copy procedure and results

Created a temporary source copy without .git, node_modules, dist, or .env files. No source checkout environment was reused. Followed the README's PowerShell Copy-Item commands, then pnpm install --frozen-lockfile and pnpm dev from the copy's root. Installation completed from the single lockfile with no changes to it.

A temporary real MongoDB 7.0.24 process supplied the README's local prerequisite on 127.0.0.1:27017. The environment examples were used unchanged. This verified the local MongoDB protocol/driver flow, not installation of a permanent MongoDB operating-system service.

| Check | Result |
| --- | --- |
| Root frozen installation | Passed |
| Root development command | Both Vite 5173 and Express 5000 started |
| Frontend → API → database | Home displayed API: ok. Database: connected. |
| Signed-out protected access | /account redirected to /login |
| Registration | Form created account and opened protected page |
| Session persistence | Full reload restored the authenticated account |
| Logout | Redirected to sign-in; server replay rejection also covered in tests |
| Incorrect password | Visible error, form remained usable |
| Login / keyboard submission | Enter submitted credentials and opened account |
| Expiration | Shortened only the verification account's temporary session expiry, reloaded it before expiration, and observed the sign-in redirect with the expired-session message |
| API outage | Stopped servers, clicked Check again on the loaded page; visible connection error |
| Recovery / built frontend | pnpm start plus pnpm --filter frontend preview --port 5173 --strictPort; health and login passed using built assets |
| Mobile | Login inspected at 375 × 812; no horizontal overflow; labels, inputs, and button remained usable |
| Frontend 404 | Missing path displayed Page not found and return link |
| Browser runtime | No application runtime errors during happy-path checks |
| Missing configuration | Exit 1 with actionable MONGO_URI error |
| Unreachable database | Exit 1 with safe database connection error |
| Occupied backend port | Exit 1 with PORT already in use message |
| Lint | Both apps passed |
| Backend tests | 10 passed, using an independently owned temporary database |
| Frontend tests | 7 passed across 4 files |
| Build | Passed; stylesheet approximately 31 KB (6.4 KB gzip) |

The fresh-copy build exposed broad Tailwind source scanning. Explicitly scoped it to frontend/src, applied the fix to the copy, and rebuilt both locations successfully. The README preview command was also corrected to use the already allowed origin on port 5173. Backend test isolation ignores application environment files/URIs and guards collection cleanup with the owned database name and port. No application database was cleaned.

## Limits and remaining repository settings

- GitHub-hosted CI was configured but not run remotely. The equivalent commands passed locally on Windows; the Ubuntu runner remains to be exercised by a push/PR.
- No Atlas, Render, Vercel, or other public deployment was created or tested. HTTPS, reverse-proxy topology, cross-site cookies, and third-party-cookie restrictions need verification on the chosen host. Secure/SameSite cookie attributes are covered in backend tests.
- The owner must confirm/enable Settings → General → Template repository on GitHub. Its remote state was not verified or modified.
- Mobile verification used a Chromium viewport, not a physical phone; this was not a full accessibility audit or cross-browser suite.
- No shared Redis/Upstash store is implemented or required. In-memory limiting is for a single process; it resets on restart.
- This verification establishes a reusable starting point, not production readiness or a security audit.

To repeat after future changes: follow README first run in a fresh copy, run pnpm check, then exercise the browser checks above. Temporary verification accounts and database processes used for this record are disposable and are not included in the template.
