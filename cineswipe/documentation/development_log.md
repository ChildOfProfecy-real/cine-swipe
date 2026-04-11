# CineSwipe Development Log: Mistakes & Fixes

*Note: Review this document before starting each new phase to avoid repeating past mistakes.*

## Log Entries

**2026-03-07 - Incorrect Directory Path Assumption**
* **Mistake:** Attempted to search for files in `d:/CineSwipe/cineswipe-mobile` initially.
* **Fix/Learning:** The actual project structure nests the repos one level deeper under a `cineswipe/` folder (i.e., `d:/CineSwipe/cineswipe/cineswipe-mobile`). Always verify the absolute path of the workspace before running `find_by_name` or `grep_search`.

**2026-03-07 - Deleted File Without Backup (No Git)**
* **Mistake:** Permanently deleted `app/admin/upload.tsx` using `Remove-Item` without first checking if a git repository existed to allow recovery.
* **Fix/Learning:** This project has NO git repo. When removing files, always move them to a `deprecated/` folder or rename them (e.g., `.tsx.bak`) instead of permanent deletion. The file was reconstructed from conversation history and saved to `app/deprecated/upload.tsx.bak`.

**2026-03-07 - Supabase RLS `ALTER TABLE` Permission Error**
* **Mistake:** The `supabase_rls_policies.sql` file contained `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;` which fails with error `42501: must be owner of table objects` because the Supabase SQL Editor user is not the owner of `storage.objects`.
* **Fix/Learning:** On Supabase, RLS on `storage.objects` is managed via the Storage settings in the Dashboard and is typically already enabled by default. The `ALTER TABLE` command was commented out in the SQL file. Users should skip it and only run the `CREATE POLICY` commands.

**2026-03-07 - Next.js 16 Middleware Deprecation Warning**
* **Issue:** Building the admin panel shows `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` — this makes PowerShell report a non-zero exit code even though the build succeeds.
* **Fix/Learning:** This is a Next.js 16 API change. The `middleware.ts` file still works but should be migrated to the `proxy` convention in the future. The warning does NOT block the build.

**2026-03-07 - Stale `.next/dev/types/routes.d.ts` After Adding Routes**
* **Issue:** After adding the `/admin/users` route, `tsc --noEmit` reported `routes.d.ts is not a module` because the auto-generated route types were stale.
* **Fix/Learning:** Delete the `.next` folder (`Remove-Item -Recurse -Force ".next"`) before rebuilding. The file gets regenerated correctly on the next build or dev server start.

**2026-03-07 - Supabase DB Unreachable During Migration (P1001)**
* **Issue:** Running `npx prisma migrate dev --name add_subscriptions` failed with `P1001: Can't reach database server` — likely the Supabase free-tier project was paused due to inactivity.
* **Fix/Learning:** 
  1. The migration SQL was saved manually to `documentation/migration_add_subscriptions.sql` — run it in Supabase SQL Editor when the project is unpaused.
  2. `npx prisma generate` still works without DB access (it only reads the schema file), so the Prisma Client was regenerated successfully.
  3. To unpause: Go to Supabase Dashboard → Project → Click "Restore Project".

## Admin Panel Bug Fixes

### 6. Admin Panel Buttons Not Clickable (Confirm Dialog Failure)
**Issue:** The "Grant", "Revoke", "Promote", and "Demote" buttons on the Admin Users page were completely unresponsive when clicked, and no API calls or console errors were generated.
**Root Cause:** The `onClick` handlers used native synchronous `window.confirm()` dialogs to ask the admin for confirmation before proceeding. Modern browser embedded environments (like Expo Web, Safari WebViews, or Electron sandboxes) often automatically and silently block these native JS dialogs. When blocked, `confirm()` defaults to `false`, causing the handlers to immediately execute their early `return` without attempting an API call or showing any visual feedback.
**Fix applied:** I completely removed the `window.confirm()` checks from `page.tsx`. The admin action handlers now immediately execute the backend API update upon clicking the button without prompting.

**2026-03-08 - Admin Panel: Movie Not Showing After Creation (Partial Fix — Frontend Only)**
* **Issue:** After creating a movie via the admin panel, the dashboard page shows stale data.
* **Frontend Fix Applied (valid improvement, keeps working after the real bug was fixed):**
  1. In `app/admin/movies/new/page.tsx`: Changed `router.push('/admin')` to `router.replace('/admin')` + `router.refresh()`.
  2. In `app/admin/page.tsx`: Wrapped `fetchData` in `useCallback([token])` and added `setLoading(true)`.
* **Note:** This was NOT the primary cause. The real bug was the PgBouncer issue below.

**2026-03-08 - Dashboard, Analytics & App 500 Errors (Actual Root Cause: PgBouncer Prepared Statements)**
* **Issue:** ALL backend API calls (`GET /admin/stats`, `GET /movies`, `GET /users/me/watchlist`) returned **500 Internal Server Error**. Affected: admin Dashboard, Analytics page, and the mobile app. Some routes worked fine (`GET /users/me`, `GET /users/me/likes`, `GET /subscription/status`, `GET /users/me/continue-watching`).
* **Root Cause:** PostgreSQL error `26000: prepared statement "s5" does not exist`. Supabase uses **PgBouncer in transaction pooling mode** by default (connection URL: `pooler.supabase.com:6543`). PgBouncer in transaction mode does NOT support prepared statements — it reassigns connections between transactions, so a prepared statement created in one transaction doesn't exist in the next. Prisma by default uses prepared statements for query caching, which causes intermittent crashes.
* **Previous incorrect diagnosis:** Initially thought it was a stale Prisma client (EPERM file lock) or zombie Node.js processes. While those were real issues that masked the true problem, the PgBouncer incompatibility was the actual root cause — confirmed by the error surviving fresh restarts and Prisma regeneration.
* **Fix:** Added `?pgbouncer=true&connection_limit=1` to `DATABASE_URL` in `.env`:
  ```
  DATABASE_URL="postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
  ```
  The `pgbouncer=true` flag tells Prisma to disable prepared statements. `connection_limit=1` prevents exhausting the pooler's limited connections.
* **Verification:** After applying the fix, tested `GET /movies` 5 times consecutively — all returned 200 OK. Logged into admin panel with `admin@cineswipe.com`, confirmed Dashboard shows 5 movies/6 clips/2 users, Analytics shows all stats including Most Liked Movies and Recent Signups. No errors.
* **Key Learning:** When using Supabase with Prisma, ALWAYS use `?pgbouncer=true` in the pooled connection URL. The direct connection URL (`db.*.supabase.co:5432`) doesn't need this flag but has fewer concurrent connections available.

**2026-03-08 - Mobile App Network Error on Device/Emulator**
* **Issue:** The mobile app returned "Network error" when trying to log in or sign up, despite the Express backend running perfectly on `http://localhost:3001`.
* **Root Cause:** The `API_BASE_URL` in `cineswipe-mobile/src/lib/api.ts` was hardcoded to `http://localhost:3001`. When running an Expo app on a physical device or an Android Emulator, `localhost` resolves to the phone/emulator itself, *not* the development computer running the backend.
* **Fix Applied:** Changed the `API_BASE_URL` to point to the development computer's local IP address on the Wi-Fi network (`http://192.168.0.105:3001` in this specific session). 
* **Learning:** Always use the machine's LAN IP address (e.g., `192.168.x.x`) instead of `localhost` when developing React Native apps that need to communicate with a local backend server. 

*(New entries will be added here chronologically)*
