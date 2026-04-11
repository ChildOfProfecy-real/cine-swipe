# CineSwipe Documentation Hub

Welcome to the CineSwipe documentation! 👋

If you are new here, this guide will explain everything you need to know about how this app is built, how it works, and where to find things.

## 🚀 What is CineSwipe?
CineSwipe is a movie discovery app that feels like TikTok. Instead of scrolling through boring lists of text, you swipe through full-screen video clips to decide what to watch next.

## 📚 Feature Guides
We have broken down the documentation into easy-to-read guides for each major part of the app:

**1. The Foundation**
*   **[Project Structure & Backend](feature_backend.md)**: Start here! Understand the Client-Server architecture, the Database, and how the folders are organized.

**2. The Features**
*   **[Authentication](feature_authentication.md)**: How users sign up, log in, and how we keep their accounts secure.
*   **[Movies & Player](feature_movies_player.md)**: The core "TikTok" experience. Explains the infinite scroll, video player logic, and touch handling.
*   **[User Lists](feature_user_lists.md)**: How "Likes" and "Watchlists" work, and how we make them feel instant using Optimistic UI.

**3. The Mobile App**
*   **[Mobile App Guide](mobile_app_guide.md)**: A tour of the screens, user flows, and technical details specific to the mobile application.

**4. Deployment & Costs**
*   **[Cloud Cost Analysis](cloud_cost_analysis.md)**: A breakdown of what it costs to run this app in the cloud (AWS/Firebase) and how to scale it.

**5. Administration**
*   **Movie Uploads**: Admins can upload movies directly from the app via the Profile screen dashboard.

## 🛠 Quick Start
Want to get it running?

1.  **Start the Backend**:
    ```bash
    cd cineswipe-backend
    npm run dev
    ```
2.  **Start the App**:
    ```bash
    cd cineswipe-mobile
    npx expo start --web
    ```

## 🧩 Key Technologies
*   **Frontend**: React Native, Expo, Zustand (State), Expo Router (Navigation).
*   **Backend**: Node.js, Express, Prisma (Database), SQLite.
