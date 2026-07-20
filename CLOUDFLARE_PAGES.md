# SahAI frontend deployment on Cloudflare Pages

The frontend is a static Vite + React application. The Render Web Service remains the backend; Supabase remains the database/auth provider; Cloudinary remains image storage.

## Cloudflare project settings

Connect the GitHub repository and use:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | `Vite` |
| Root directory | leave blank |
| Build command | `npm run build` |
| Build output directory | `dist` |

## Production environment variables

Add these in Cloudflare Pages → Settings → Environment variables:

```env
VITE_API_URL=https://sahai-k7hk.onrender.com
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
NODE_VERSION=20
```

`VITE_API_URL` must not have a trailing slash. Replace the Supabase placeholders with the same public values used by the existing Render Static Site.

Never add backend secrets to Cloudflare Pages. In particular, do not add `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, `APP_ADMIN_PASSWORD`, or any non-`VITE_` private credential.

## SPA routing

`public/_redirects` is included and Vite copies it to `dist/_redirects`:

```text
/* /index.html 200
```

This allows direct visits and refreshes on `/auth/callback`, `/dashboard/*`, `/dashboard/vendors/:username`, and other React Router routes.

`public/_headers` adds immutable caching for Vite's hashed assets and safe browser headers.

## Supabase Auth URL configuration

After Cloudflare assigns the production URL, for example `https://sahai.pages.dev`, configure:

**Site URL** (use the primary production frontend):

```text
https://sahai.pages.dev
```

**Additional Redirect URLs**:

```text
https://sahai.pages.dev/auth/callback
https://sahai-1-uj34.onrender.com/auth/callback
http://localhost:5173/auth/callback
```

Keep the Render callback while both frontends are active.

## Google OAuth configuration

Authorized JavaScript origins:

```text
https://sahai.pages.dev
https://sahai-1-uj34.onrender.com
http://localhost:5173
```

The Google Authorized redirect URI remains Supabase's callback, not the Pages callback:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

## Verification checklist

- Open the Pages root URL.
- Refresh `/login`, `/dashboard/profile`, and `/dashboard/vendors` directly.
- Test email/password, Google, and Guest login.
- Save Business Profile and unique username.
- Search another vendor and verify the profile is read-only.
- Upload a profile/product image.
- Save and download a Business Card.
- Verify account deletion.

Do not disable the Render Web Service. Only the old Render Static Site is optional after the Cloudflare frontend is fully verified.
