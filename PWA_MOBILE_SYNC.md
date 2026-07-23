# SahAI PWA and mobile update behavior

## What syncs after a GitHub push

### Cloudflare Pages frontend

When Cloudflare Pages is connected to the GitHub `main` branch with automatic deployments enabled, every frontend commit triggers a new Vite build and deployment. SahAI's service worker uses network-first navigation and content-hashed asset caching. It checks for a service-worker update on load and once per hour; an already-installed PWA refreshes once when a new worker takes control.

Users normally receive the latest web/PWA frontend when they reopen or refresh the app after Cloudflare finishes deploying. If a tab has remained open for a long time, close/reopen or refresh it.

### Render backend

When the Render Web Service is connected to the same GitHub branch with **Auto-Deploy: Yes**, backend commits trigger a backend rebuild/redeploy. The Cloudflare site, installed PWA, old Render Static Site and future Android app all call the same Render API, so they use the updated backend after deployment finishes.

Database migrations in `server/supabase/schema.sql` are idempotently applied by the backend during startup. Back up production data before destructive schema changes.

### User data

Profiles, products, usernames, Business Cards, images and settings are stored centrally in Supabase PostgreSQL/Cloudinary through the Render API. Data changes made on any supported client are available to the others immediately after the API request succeeds.

## What does not automatically sync

A Capacitor APK/AAB contains a packaged copy of the frontend. GitHub or Cloudflare frontend deployments do not replace code inside an already-installed native app.

- Backend/data changes: visible to an installed app immediately if the API remains compatible.
- Frontend/UI changes: require rebuilding the Capacitor project, increasing Android `versionCode`/`versionName`, generating a new APK/AAB, and installing or publishing the update.
- Play Store users receive the new native version through Google Play after review/rollout.

Do not configure a production Capacitor app to load arbitrary remote frontend code merely to bypass app updates. Package trusted local assets and keep the API contract backward-compatible with older installed versions during rollout.

## Current PWA milestone

Included:

- `manifest.webmanifest`
- 192px, 512px, maskable and Apple touch icons
- install button in the dashboard header
- mobile-only install button beside Get Started on the landing page
- no floating install popup
- standalone display metadata
- network-first React Router navigation
- offline fallback screen
- same-origin hashed asset caching
- no caching of Render, Supabase or Cloudinary API data
- hourly service-worker update checks
- Cloudflare no-cache headers for `sw.js`, manifest and `index.html`

## Mobile validation before Capacitor

Deploy to Cloudflare Pages over HTTPS, then test on a real Android device:

1. Open the Pages URL in Chrome.
2. Sign in and confirm the Install SahAI prompt appears.
3. Install and launch from the home screen.
4. Confirm standalone/full-screen display and icon.
5. Test Google/email/Guest login.
6. Test profile and product image uploads.
7. Test Username and Vendor Search.
8. Test Business Card JPG download/share.
9. Turn off the network and confirm the offline screen appears for uncached data.
10. Push a visible frontend change to `main`, wait for Cloudflare deployment, then reopen/refresh the installed PWA and verify the update.

Only after this mobile check should the same frontend be wrapped with Capacitor and Android OAuth/deep links configured.
