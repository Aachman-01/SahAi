# SahAI — Street Vendor Digitalization Agent

A full-stack app: **Vite + React + TypeScript** frontend with a Node.js API, **Supabase PostgreSQL in production**, and a built-in SQLite fallback for local development. All data is served from and persisted to the backend — there is **no hardcoded/mock data** in the UI. Every change you save (profile, products, QR settings, website template, business card design, notifications, admin actions, etc.) is written to the database and instantly synced across every page (including the public customer website).

## Requirements

- **Node.js >= 22.5** (local fallback uses built-in `node:sqlite`; production installs the pure-JavaScript `pg` package).
- Local SQLite/filesystem mode works offline. Supabase PostgreSQL and Cloudinary modes require internet access.

## 1. Start the backend

```bash
cd server
npm start          # runs on http://localhost:4000
```

On first run the backend automatically creates `server/sahai.db` (SQLite, WAL mode) and seeds it from `server/seed-data.js`. Useful scripts:

```bash
npm run dev        # same as start
npm run reset      # delete the DB so it re-seeds fresh on next start
```

Override the port with `PORT=5000 npm start`, or the DB path with `SAHAI_DB=/tmp/sahai.db npm start`.

### Cloudinary image storage (recommended for Render)

The backend automatically uses Cloudinary when all three credentials are present. Without them it keeps the existing local `server/uploads/` fallback.

Set these as **backend environment variables** in Render → your Web Service → Environment:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=sahai
APP_ADMIN_EMAIL=your-admin-email@example.com
APP_ADMIN_PASSWORD=a-long-unique-password
APP_ADMIN_NAME=SahAI Admin
ALLOW_DEMO_AUTH=false
```

Find the first three values in the Cloudinary Console. Do not add them to the frontend, do not prefix them with `VITE_`, and do not commit real secrets.

With Cloudinary enabled:

- `POST /api/uploads` sends the compressed JPEG/PNG/WebP to Cloudinary using a server-generated signature.
- The returned HTTPS URL is stored in the vendor/product/gallery record.
- Replacement and deletion remove the owned Cloudinary asset.
- The `uploaded_files` table tracks owner, provider, and Cloudinary public ID.
- `GET /api/health` returns `"imageStorage": "cloudinary"` when configuration is active.

Cloudinary provides persistent **image** storage. With `DATABASE_URL` configured, business and user data is stored in Supabase PostgreSQL; otherwise the backend uses local SQLite.

For local development, either export these variables before `npm start`, or leave them unset to use `server/uploads/`. Node does not automatically load `server/.env.example`; it is a reference for Render/shell configuration.

## 2. Start the frontend

```bash
# from the project root
npm install
npm run dev        # Vite dev server (default http://localhost:5173)
```

The frontend reads the API base URL from `.env`:

```
VITE_API_URL=http://localhost:4000
```

Copy `.env.example` to `.env` if it is missing.

## Demo logins

- **Vendor** — choose “Vendor” and enter any phone number; the demo OTP is **1234**.
- **Admin** — choose “Admin”.
- **Guest** — browse in read-only vendor mode.

## How the data flows

- `src/lib/api.ts` — axios client; stores the session token in `localStorage` (`sahai_token`) and sends it as `Authorization: Bearer <token>`.
- `src/hooks/useApi.ts` — React Query hooks for every resource. Mutations invalidate/refresh the relevant queries so the UI re-syncs immediately after a save.
- `server/server.js` — REST API (auth, profile, products, transactions, schemes, reviews, analytics, dashboard, settings, QR, website, business card, marketing, notifications, admin, and a public vendor endpoint).
- `server/db.js` — asynchronous Supabase PostgreSQL adapter with SQLite development fallback.
- `server/supabase/schema.sql` — idempotent Supabase schema and Row Level Security setup.
- `server/seed-data.js` — the initial seed content (used only to populate an empty database).

## API overview

All endpoints are under `http://localhost:4000`. Authenticated endpoints require the `Authorization: Bearer <token>` header.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/otp/send`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Profile | `GET/PUT /api/profile` |
| Products | `GET/POST /api/products`, `PUT/DELETE /api/products/:id` |
| Transactions | `GET/POST /api/transactions` |
| Schemes | `GET /api/schemes`, `POST /api/schemes/:id/bookmark` |
| Reviews | `GET/POST /api/reviews` |
| Analytics | `GET /api/analytics`, `GET /api/dashboard` |
| Settings | `GET/PUT /api/settings` |
| QR | `GET/PUT /api/qr` |
| Website | `GET/PUT /api/website` |
| Business Card | `GET/PUT /api/business-card` |
| Marketing | `GET /api/marketing` |
| Notifications | `GET/POST /api/notifications`, `PUT /api/notifications/:id`, `POST /api/notifications/read-all`, `DELETE /api/notifications/:id` |
| Admin | `GET /api/admin/vendors`, `PUT /api/admin/vendors/:id`, `GET /api/admin/stats`, `GET /api/admin/schemes`, `GET /api/admin/reports` |
| Public | `GET /api/public/vendor/:slug` (no auth — powers the customer website) |
| Health | `GET /api/health` |

## Supabase PostgreSQL production setup

The backend automatically selects **Supabase PostgreSQL** when `DATABASE_URL` is set. Without it, local development continues to use `server/sahai.db`. The frontend API contract does not change.

1. In Supabase, open **SQL Editor**, paste `server/supabase/schema.sql`, and run it once. The backend also runs the same idempotent schema at startup.
2. Open **Connect** in Supabase and copy the PostgreSQL connection string. For Render, prefer the **transaction pooler** URI when the direct connection is IPv6-only. Replace the password placeholder locally; never paste the completed URI into chat or frontend code.
3. In Render → Web Service → Environment, add:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@POOLER_HOST:6543/postgres
DATABASE_SSL=true
DATABASE_POOL_SIZE=5
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=sahai
APP_ADMIN_EMAIL=your-admin-email@example.com
APP_ADMIN_PASSWORD=a-long-unique-password
APP_ADMIN_NAME=SahAI Admin
ALLOW_DEMO_AUTH=false
```

4. Set Render's root directory to `server` and use `npm install` as the build command and `npm start` as the start command. Redeploy.
5. Check `/api/health`. Production should report `"database":"supabase-postgres"` and `"imageStorage":"cloudinary"`.

`DATABASE_URL`, `APP_ADMIN_PASSWORD`, the database password, and `CLOUDINARY_API_SECRET` are backend-only secrets. Never use a `VITE_` prefix or commit real values. Tables have Row Level Security enabled with no browser policies because all access is intentionally routed through the authenticated Render API. Public signup always creates a vendor account; admin routes enforce the admin role. Production admin credentials are provisioned from Render environment variables, and demo role/OTP login is disabled by default when PostgreSQL is active.

Existing SQLite rows are not automatically copied to Supabase. New deployments seed the demo dataset when PostgreSQL is empty unless `SEED_DEMO_DATA=false`. Real existing data requires a one-time migration before switching production traffic.

## Google sign-in with Supabase Auth

Google login uses Supabase Auth for the account chooser and identity verification, then exchanges the verified Supabase access token for the existing SahAI backend session. New Google users receive a normal isolated vendor record; existing email accounts are linked by verified email. Browser-supplied names/emails are never trusted.

1. In **Google Cloud Console**, create an OAuth 2.0 Client ID of type **Web application**. Add the frontend origins (`http://localhost:5173` and the Render static-site URL) under Authorized JavaScript origins. Add Supabase's callback URL under Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
2. In **Supabase → Authentication → Providers → Google**, enable Google and enter the Google Client ID and Client Secret.
3. In **Supabase → Authentication → URL Configuration**, set the production frontend as Site URL and add `http://localhost:5173/auth/callback` plus the Render frontend `/auth/callback` URL to Redirect URLs.
4. Add to the frontend environment (public values):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key
```

5. Add the same project URL/key to the Render backend so it can verify access tokens:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_publishable_or_anon_key
```

Never use `SUPABASE_SERVICE_ROLE_KEY` in the frontend. The Google Client Secret stays only inside Supabase's provider configuration. The login request includes `prompt=select_account`, so Google displays the account chooser even when a Google session already exists.

Guest login uses `/api/auth/guest` and creates a separate guest user/vendor workspace. It does not re-enable shared demo-role authentication.

## Permanent account deletion

Settings → Delete Account calls the authenticated `DELETE /api/account` endpoint. It deletes owned Cloudinary/local uploads first, then removes sessions, notifications, bookmarks, user settings, vendor QR/website/business-card records, gallery, products, transactions, reviews, vendor profile, and finally the `users` row containing the email. Guest and password accounts need no additional provider cleanup.

Google users are tracked by Supabase Auth user ID in `users.authProviderId`. Add this backend-only Render variable so the API can also delete the corresponding Supabase Auth identity:

```env
SUPABASE_SERVICE_ROLE_KEY=your_legacy_service_role_key
```

Obtain it from Supabase Project Settings → API Keys. Never expose this key in the frontend, never prefix it with `VITE_`, and never commit it. The backend refuses to delete a linked Google account if provider deletion cannot be completed, preventing an apparently deleted account from being recreated silently on the next Google login. Administrator accounts cannot be deleted from the user Settings page.

## Business Card designer

Local SEO has been fully removed and replaced with a profile-powered Business Card section at `/dashboard/business-card`. Each vendor can choose modern/classic/minimal templates, portrait or landscape layout, preset/custom colors, typography, tagline, profile field visibility, photo, and UPI QR. Designs persist per vendor through `GET/PUT /api/business-card`.

The live canvas is also the export renderer. **JPG** generates a high-quality `1050×600` landscape or `700×1050` portrait file. **Share** uses the browser's native file-sharing sheet where supported (especially mobile); unsupported browsers automatically download the JPG instead. Profile fields and account email remain sourced from the canonical Business Profile/account data, so profile edits appear on the next card render.
