# CineSwipe Implementation & Launch Plan

This plan focuses on building out all core software features (which are 100% free to develop) before moving to deployment and infrastructure phases that might incur hosting costs or require paid subscriptions.

## Phase 1: Security & Beta Release Blockers (Immediate Action)
*The absolute bare minimum required before any users can safely test the app.*

### 1.1 Secure the Database & Storage
*   **Action:** Apply the existing Supabase Row Level Security (RLS) policies.
*   **Action:** Rotate the Supabase service key and anon key (since they were previously in git history).

### 1.2 Remove Broken Mobile Features
*   **Action:** Completely rip out the admin upload screen and its associated navigation/routes from the React Native Expo mobile app.

### 1.3 Core Flow Validation & Crash Prevention
*   **Action:** Conduct end-to-end testing of the watch flow (progress saving, continue watching, liking).
*   **Action:** Handle 401 Unauthorized errors in the mobile app.

---

## Phase 2: Cost-Free Core Features & Enhancements (High Priority)
*These tasks require ZERO purchases or subscriptions. They are purely code additions that we can build and test locally right now to perfect the app before you pay for hosting.*

### 2.1 Movie Metadata Editing
*   **Action:** Build the UI in the Next.js Admin Panel to edit existing movies (update title, description, genre, thumbnail, and hero image).
*   **Action:** Ensure backend API endpoints (`PUT /admin/movies/:id`) are fully functional.

### 2.2 User Management Interface & Analytics
*   **Action:** Build a User Management page in the Admin Panel to view, delete, or ban users.
*   **Action:** Build a basic Analytics page in the Admin Panel fetching counts from your existing database.

### 2.3 Upload Reliability & Admin UX
*   **Action:** Add proper error boundary components in the Admin Panel.
*   **Action:** Implement client-side file size/type validation before uploading.
*   **Action:** Add visual upload progress indicators for large media files.
*   **Action:** Add drag-and-drop clip reordering in the Admin panel.

### 2.4 Mobile UX Polish
*   **Action:** Add loading skeletons in the mobile app's Home screen.

---

## Phase 3: Deployment & Infrastructure Preparation (Potential Costs)
*Moving the code from your local machine to the internet so testers can actually download the app and connect to the live database. These steps may involve free tiers, but could scale into paid tiers.*

### 3.1 Backend & Admin Hosting Setup
*   **Action:** Configure environment variables (`.env.production`) to separate local testing from live production data.
*   **Action:** Deploy the **Next.js Admin Panel** to **Vercel** (Has a free tier).
*   **Action:** Deploy the **Express Backend APIs** to **Render** or **Railway** (Requires setting up billing/credit card even for some free tiers; scales to paid).

### 3.2 Mobile App Production Build
*   **Action:** Configure the Expo production build settings.
*   **Action:** Build the standalone APK (Android) and/or run via TestFlight (iOS) using Expo Application Services (EAS). (Requires an Apple Developer Account for iOS distribution which costs $99/year).

---

## Phase 4: Advanced Infrastructure (Post-Beta Launch)

### 4.1 Server-side Processing & Scaling
*   **Action:** Implement server-side FFmpeg processing to automatically extract precise clip durations.
*   **Action:** Implement a CDN caching layer and automated database backups via Supabase to ensure scalability beyond 500 users.
