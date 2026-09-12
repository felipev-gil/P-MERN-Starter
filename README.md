# P-MERN Starter

A small, reusable JavaScript MERN starting point. Set up MongoDB, configure two environment files, install once, and run both apps. This is a foundation to adapt and review for your project, not a claim of production readiness.

## Prerequisites

- Node.js **24.14 or newer within Node 24**; verification and CI use **24.20.0** (also in .node-version).
- pnpm **11.19.0**, pinned in package.json. Install with `npm install --global pnpm@11.19.0` if needed. Confirm with `node --version` and `pnpm --version`.
- A running MongoDB server (MongoDB 7 or newer), or an Atlas database you can reach. For a local installation, start its service; the example uses `127.0.0.1:27017`. Docker is not required. Atlas needs a database user and network access rules; URL-encode special characters in credentials.
- Git and network access for dependencies. Tests download a pinned MongoDB 7.0.24 binary on first use; they do not need your database.

## First run

From your new clone's root, copy the examples. PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

macOS/Linux:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The example values work with local MongoDB. For Atlas, edit backend/.env and replace MONGO_URI with your connection string including a database name. Do not commit .env files. Then, from the root:

``sh
pnpm install --frozen-lockfile
pnpm dev

```

Open **http://localhost:5173**. The home page should show **API: ok. Database: connected.** Register an account (password of at least 12 characters), open Account, sign out, then sign in again. Opening /account while signed out redirects to /login. Stop development with Ctrl+C.

Use localhost consistently in the browser; switching to 127.0.0.1 changes the origin and cookie site. Vite intentionally fails if port 5173 is occupied instead of silently changing the port and breaking CORS.

## Configuration

Backend variables (backend/.env; loaded by the backend scripts):

| Variable | Example/default | Purpose |
| --- | --- | --- |
| NODE_ENV | development | development, test, or production; production requires HTTPS origins and uses Secure cookies |
| PORT | 5000 | HTTP port, 1–65535 |
| MONGO_URI | mongodb://127.0.0.1:27017/mern_starter | Required MongoDB URI; use a distinct database for each project/environment |
| CORS_ORIGINS | http://localhost:5173 | Required comma-separated exact frontend origins, no paths, wildcards, or trailing slashes |
| SESSION_HOURS | 24 | Fixed session duration, integer 1–168; not extended by activity |
| COOKIE_SAME_SITE | lax | lax, strict, or none; none requires production HTTPS |
| TRUST_PROXY_HOPS | 0 | Number of trusted reverse-proxy hops, 0–10; keep 0 for direct local access |

Frontend variable (frontend/.env): `VITE_API_URL=http://localhost:5000/api`. It includes /api. Vite embeds it at build time, so rebuild after changing it. An unset value falls back to /api for a deployment that proxies API requests on the same origin. No development proxy is provided: copy the example for local setup. **All VITE_ values are public; never put secrets here.** Restart development servers after changing environment files.

Missing/invalid backend configuration fails before listening. Unavailable MongoDB fails after a five-second selection timeout with a configuration hint, without printing credentials. Duplicate email and session indexes are initialized before listening; database access must allow index creation.

## Commands and quality checks

Run from the root:

| Command | Action |
| --- | --- |
| pnpm dev | Start Express in watch mode and Vite concurrently |
| pnpm --filter backend dev | Backend only |
| pnpm --filter frontend dev | Frontend only |
| pnpm lint | Lint both apps |
| pnpm test | Isolated backend integration tests and focused frontend tests |
| pnpm --filter backend test | Backend tests only |
| pnpm --filter frontend test | Frontend tests only |
| pnpm build | Build frontend into frontend/dist |
| pnpm start | Run backend without watch mode |
| pnpm --filter frontend preview | Locally inspect the built frontend (not a production server) |
| pnpm check | Lint, all tests, and frontend build |

For the preview command, stop pnpm dev first, run pnpm start in one terminal, then run the preview command in another. Port 5173 keeps preview compatible with the example CORS origin.

One root pnpm workspace and lockfile cover both apps. Use frozen installation in CI and when adopting the template; use pnpm install to intentionally update the lockfile after dependency changes. Do not create per-app lockfiles. Node runs backend JavaScript directly, so there is no backend compile step.

Backend tests use Node's test runner, Supertest, and mongodb-memory-server. They start an owned temporary MongoDB process, never import dotenv, never use MONGO_URI, and verify the owned port and database before cleanup. MongoDB binary downloads need internet the first time and a supported OS/runtime. They use no Atlas or Upstash credentials. Frontend Vitest tests protect API error/expiry handling and protected route states. GitHub Actions runs frozen installation, both linters, tests, and build on Ubuntu. Browser checks are manual; see [verification](docs/VERIFICATION.md).

## Authentication and API conventions

Authentication uses **opaque server-side sessions**, not JWTs. Registration and login generate 32 random bytes. The browser receives a host-only HttpOnly cookie scoped to /api; MongoDB stores only its SHA-256 hash, user reference, and expiration. Passwords use bcrypt with cost 12. The 72-byte password ceiling prevents bcrypt silently truncating a password; Unicode characters can occupy multiple bytes.

The cookie is unavailable to frontend JavaScript; nothing is stored in localStorage or sessionStorage. HttpOnly reduces token theft through script access, but does not make XSS harmless: injected scripts can still issue authenticated requests. Every write request requires an explicitly allowed Origin (including login and logout), which protects these browser cookie flows against CSRF. CLI clients must also supply the documented Origin header. CORS is not authorization; protect every private backend route with requireAuth.

Sessions expire after SESSION_HOURS even if MongoDB's TTL cleanup has not run. The frontend timer clears its session at expiration, and a protected API 401 also sends the user back to sign in. Reload fetches /auth/me; network failures show a retry instead of pretending the user is signed out. Logout deletes the current session before clearing its cookie; failed logout stays visible and can be retried. Re-login replaces the browser's previous session. Other browsers remain logged in until their own logout or expiration. A tab's navigation may lag a logout in another tab until its next protected request or reload; server access is already revoked.

| Method/path | Behavior |
| --- | --- |
| GET /api/health | 200 if database connected, 503 otherwise; not authenticated |
| POST /api/auth/register | name, email, password; 201 and a session |
| POST /api/auth/login | email, password; 200 and a session |
| GET /api/auth/me | Protected user and expiresAt; otherwise 401 |
| POST /api/auth/logout | Revoke current session, clear cookie; idempotent 204 |

Successful JSON uses `{ "data": ... }`. Errors use `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "email": "..." } } }`; fields appears only for field validation. Common statuses are 400 (JSON), 401 (authentication), 403 (origin), 404, 409 (duplicate email), 413 (body size), 422 (validation), 429 (rate limit), and 500. Unexpected errors never expose stack traces or database details in responses. Email existence is disclosed by registration's 409 response; assess this policy for your project.

Registration and login share an in-memory limit of 20 attempts per IP per 15 minutes, including successful attempts. This needs no external account. Counters reset on restart and are separate on each server instance; shared NAT users can affect each other. For a multi-instance deployment, replace the limiter store with an appropriate shared store (Redis/Upstash is optional) and test its failure behavior. No Upstash packages or credentials are required by this template.

## Deployment configuration

- Build static frontend assets with `pnpm install --frozen-lockfile` then `pnpm build`; publish frontend/dist. Configure SPA fallback to index.html for paths such as /account and /login. If proxying /api, route those requests before the SPA fallback.
- Run the backend from the repository root with `pnpm start` after installation. Set backend environment variables in your host, use NODE_ENV=production, and provide MongoDB connectivity. Health-check /api/health. The backend does not serve frontend files.
- Set VITE_API_URL to the deployed API URL including /api **before building**. Set CORS_ORIGINS to the deployed frontend origin(s). All production traffic needs HTTPS.
- Prefer a single origin with /api reverse-proxied, or same-site custom domains such as app.example.com and api.example.com, using COOKIE_SAME_SITE=lax. If frontend and API are on unrelated sites, set COOKIE_SAME_SITE=none; browsers may still block third-party cookies. Same-site hosting avoids that dependency.
- Set TRUST_PROXY_HOPS only after verifying your host's actual proxy topology and that the backend cannot be reached by a shorter untrusted path. An incorrect value can undermine IP rate limiting. Do not blindly enable trust proxy.
- Configure graceful shutdown support, database backups, monitoring, security headers/CSP appropriate to your host, a shared rate-limit store if needed, and dependency/security review for your actual deployment. No provider-specific deployment is configured or claimed to be verified.

## Start a new project

1. On GitHub, use **Use this template → Create a new repository**, then clone the new repository. The owner must first enable **Settings → General → Template repository** on P-MERN-Starter; files cannot enable this setting.
2. Rename package metadata in all three package.json files and update README. If changing backend/frontend package names, also update root filter scripts and documented commands. Run pnpm install and commit the updated lockfile.
3. Set separate environment/database values and review origins, cookie policy, and proxy settings.
4. Replace the title and description in frontend/index.html and branding in Layout.jsx.
5. Remove or replace Home.jsx's health demo and Account.jsx's placeholder text. Keep auth infrastructure only if your project needs it.
6. Add your first resource using [the resource guide](docs/ADDING_A_RESOURCE.md); add tests for its authorization and validation.
7. Enable CI/branch protections as appropriate, review the MIT license, and update copyright notices for your additions.

## Scope

Included: JavaScript, pnpm workspace, React/Vite, Tailwind/DaisyUI, router/layout, API client, session context, accessible responsive forms, Express/Mongoose, validation, error handling, CORS/CSRF origin checks, password hashing, logout/expiration, local rate limiting, tests, lint, CI, and MIT license.

Optional integrations you can add: shared Redis/Upstash rate limiting, provider-specific hosting, email, Docker, observability, and additional security controls.

Intentionally absent: business models/features, OAuth, roles, refresh tokens/rotation, password reset, email verification, TypeScript, Next.js, microservices, and monorepo orchestration tools. No Task Manager features are copied.

Implementation references: [Express 5 error handling](https://expressjs.com/en/guide/error-handling/), [Mongoose connections](https://mongoosejs.com/docs/connections.html), and [pnpm workspace settings](https://pnpm.io/settings).

## License

[MIT](LICENSE), consistent with the original repository metadata.
```
