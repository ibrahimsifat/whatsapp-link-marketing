# Database & Authentication

This app stores its data in **Cloudflare D1** and is protected by a single
hard-coded operator account with JWT session cookies.

---

## 1. Setup

### 1.1 Create the D1 database

```bash
npx wrangler d1 create whatsapp-link-marketing
```

Copy the `database_id` it prints. You can also create the database from the
Cloudflare dashboard under **Storage & Databases → D1**.

### 1.2 Create an API token

Cloudflare dashboard → **My Profile → API Tokens → Create Token → Custom token**.

| Setting     | Value                     |
| ----------- | ------------------------- |
| Permissions | Account → **D1** → **Edit** |
| Resources   | Include → your account    |

### 1.3 Configure the environment

```bash
cp .env.example .env.local
```

Generate the auth secrets:

```bash
pnpm auth:hash "your-password-here"
```

That prints an `AUTH_PASSWORD_HASH` and a `JWT_SECRET` to paste in. Then fill in
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN` and
`AUTH_EMAIL`.

### 1.4 Create the tables

```bash
pnpm db:migrate
pnpm db:verify
```

`db:verify` confirms the credentials work, lists the tables and prints row
counts. Run it whenever something looks wrong — it isolates a database problem
from an application one.

### 1.5 Run

```bash
pnpm dev
```

Open http://localhost:3000 — you will be redirected to `/login`.

---

## 2. Architecture

```
Browser
  │  fetch (HttpOnly session cookie attached automatically)
  ▼
proxy.ts ─────────────── verifies the JWT, redirects or 401s
  ▼
app/api/**/route.ts ──── validates input (zod), authorises, delegates
  ▼
lib/db/repositories/ ─── all SQL lives here
  ▼
lib/db/index.ts ──────── Drizzle ORM (sqlite-proxy driver)
  ▼
lib/db/d1-http.ts ────── Cloudflare REST API: timeouts, retries, typed errors
  ▼
Cloudflare D1
```

| File                          | Responsibility                                          |
| ----------------------------- | ------------------------------------------------------- |
| `lib/env.ts`                  | Validated environment access; fails fast with a clear message |
| `lib/db/d1-http.ts`           | HTTP transport: signing, timeout, retry, error mapping   |
| `lib/db/index.ts`             | Drizzle instance, singleton, health check                |
| `lib/db/schema.ts`            | Schema — the single source of truth for the data model   |
| `lib/db/mappers.ts`           | Row ⇄ domain-type translation                            |
| `lib/db/repositories/*`       | All queries, one module per table                        |
| `lib/api/response.ts`         | Uniform response envelope and error translation          |
| `lib/api/schemas.ts`          | Zod validation for every request body and query string   |
| `lib/api/client.ts`           | Typed browser client with retries and 401 handling       |
| `lib/auth/*`                  | Credentials, JWT, session cookie, route guard            |
| `proxy.ts`                    | Auth enforcement + sliding session refresh               |

### Why the HTTP transport

D1's fast native binding only exists inside the Cloudflare Workers runtime.
Because this app is deployed to a Node host, every query is a call to
Cloudflare's REST API. That has three consequences the code is built around:

1. **Latency.** Each query is an HTTPS round-trip (~50–200 ms). Queries are
   therefore batched, aggregated in SQL, and parallelised with `Promise.all`
   wherever they are independent.
2. **A 100-parameter limit per statement.** Bulk operations pass their rows as a
   *single* JSON parameter and unpack it server-side with SQLite's
   `json_each()`. Importing 10,000 contacts takes a handful of requests instead
   of roughly 1,600.
3. **No transactions.** The REST API accepts one parameterised statement per
   request. Anything that must not half-apply is therefore written as one
   statement, which is atomic by definition.

If you later move to Cloudflare Workers (via `@opennextjs/cloudflare`), only
`lib/db/index.ts` needs to change — swap the sqlite-proxy driver for
`drizzle-orm/d1` with the native binding. Nothing above it is affected.

---

## 3. Schema

| Table               | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `contacts`          | The contact list. `normalized` is UNIQUE — the dedup guarantee |
| `message_templates` | Reusable templates; the starter set is seeded on first load |
| `app_settings`      | Key/value store — the active custom message lives here      |
| `send_history`      | Append-only audit log of every message sent                 |
| `import_batches`    | One row per import, for provenance and troubleshooting      |
| `auth_attempts`     | Login attempt log, backing the rate limiter                 |

Notable guarantees:

- **`UNIQUE(normalized)`** — two simultaneous imports cannot both insert the
  same phone number. Deduplication is enforced by the database, not by
  comparing against a possibly-stale in-memory snapshot.
- **`CHECK` constraints** on `contacts.status` and
  `message_templates.target_audience` — an invalid state cannot be written, even
  by a bug or a hand-run SQL statement.
- **Send history survives contact deletion.** `contact_normalized` is
  denormalised on purpose, so clearing contacts never erases the record of what
  was already sent.
- **Re-importing a list never resets `status` or `sent_at`.** The upsert fills
  in missing company data and accumulates `source`, but it will not mark an
  already-contacted business as un-contacted.

### Changing the schema

```bash
# 1. edit lib/db/schema.ts
pnpm db:generate     # writes a new migration to lib/db/migrations/
pnpm db:migrate      # applies it
```

Never hand-edit a migration that has already been applied — add a new one.

---

## 4. Authentication

One operator account, configured entirely through the environment. There is no
user table and no sign-up flow.

- The password is compared in **constant time**, and the email check runs even
  when it is wrong, so response timing reveals neither.
- `AUTH_PASSWORD_HASH` (SHA-256) is preferred over `AUTH_PASSWORD` so the
  plaintext never sits in an env file or a hosting dashboard.
- The JWT is **HS256**, signed with `JWT_SECRET`, and stored in an **HttpOnly,
  SameSite=Lax, Secure** cookie. It is never in `localStorage`: anything
  JavaScript can read, an XSS payload can read. `SameSite=Lax` blocks CSRF on
  state-changing requests.
- Sessions last 7 days and **slide**: `proxy.ts` reissues a token within a day
  of expiry, so a daily user is never logged out while an abandoned session
  still expires.
- **Rate limiting** is database-backed (8 failures per 15 minutes, per IP *or*
  email). An in-memory counter would be useless here — each serverless
  invocation may be a different instance, so an attacker just retries until they
  land on a cold one. It fails *open*, so a database outage cannot lock you out.
- Every API route calls `requireSession()` independently. `proxy.ts` already
  blocks unauthenticated traffic, but matcher config drifts; authorisation
  belongs next to the data it protects.

### Rotating the password

```bash
pnpm auth:hash "new-password"
```

Update `AUTH_PASSWORD_HASH` and redeploy. To invalidate every existing session
at the same time, change `JWT_SECRET` too.

---

## 5. API

All routes return `{ success, data?, message, errors?, meta? }`.
All require a session except `/api/auth/login` and `/api/health`.

| Method   | Route                     | Purpose                                     |
| -------- | ------------------------- | ------------------------------------------- |
| `POST`   | `/api/auth/login`         | Sign in, issue the session cookie           |
| `POST`   | `/api/auth/logout`        | Clear the session cookie                    |
| `GET`    | `/api/auth/me`            | Current operator                            |
| `GET`    | `/api/health`             | Liveness + database latency (public)        |
| `GET`    | `/api/contacts`           | Paginated, filtered, searchable list        |
| `POST`   | `/api/contacts`           | Create one contact                          |
| `GET`    | `/api/contacts/[id]`      | Fetch one                                   |
| `PATCH`  | `/api/contacts/[id]`      | Update one                                  |
| `DELETE` | `/api/contacts/[id]`      | Delete one                                  |
| `PATCH`  | `/api/contacts/bulk`      | Set status on many                          |
| `DELETE` | `/api/contacts/bulk`      | Delete many, or all with `?all=true`        |
| `POST`   | `/api/contacts/import`    | Bulk insert/merge                           |
| `GET`    | `/api/contacts/stats`     | Aggregate counters and categories           |
| `GET`    | `/api/contacts/export`    | Download as CSV or JSON                     |
| `GET`    | `/api/templates`          | List templates (seeds defaults if empty)    |
| `POST`   | `/api/templates`          | Create a template                           |
| `PATCH`  | `/api/templates/[id]`     | Update a template                           |
| `DELETE` | `/api/templates/[id]`     | Delete a template                           |
| `GET`    | `/api/settings`           | All settings                                |
| `PUT`    | `/api/settings`           | Upsert settings                             |
| `GET`    | `/api/send-history`       | Paginated audit log                         |
| `POST`   | `/api/send-history`       | Record sends, optionally marking them sent  |

`/api/contacts` query parameters: `page`, `perPage`, `status`, `category`,
`website`, `search`, `sortBy`, `sortDir`.

---

## 6. Deployment

Set every variable from `.env.example` in your hosting provider, then deploy as
normal. `.env.local` is gitignored and is **not** uploaded — the values must be
configured in the platform.

On Vercel: **Project → Settings → Environment Variables**. Mark
`CLOUDFLARE_API_TOKEN`, `AUTH_PASSWORD_HASH` and `JWT_SECRET` as sensitive.

Run migrations against production before the first deploy:

```bash
pnpm db:migrate
```

After deploying, `GET /api/health` should return `200` with
`data.status: "healthy"`.

---

## 7. Troubleshooting

| Symptom                                        | Cause and fix                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `Invalid environment configuration` on startup | A variable is missing. The message names it; check `.env.local`.               |
| `/api/health` returns 503                      | D1 is unreachable. Run `pnpm db:verify` to see the underlying error.           |
| `[7500] no such table: contacts`               | Migrations have not run. `pnpm db:migrate`.                                    |
| Every request 401s                             | `JWT_SECRET` changed, which invalidates existing sessions. Sign in again.      |
| Login returns 429                              | Rate limited: 8 failed attempts in 15 minutes. Wait, or clear `auth_attempts`. |
| `Authentication error [10000]`                 | The API token lacks **D1 → Edit**, or belongs to a different account.          |
| Imports are slow                               | Expected: each request is an HTTPS round-trip. 10,000 contacts is ~6 requests. |

Set `DB_LOGGING=true` to print every SQL statement to the server console.
