# CineSwipe Mobile App Guide

## Application Overview
CineSwipe is a mobile application built with React Native (Expo) that mimics the vertical swiping experience of TikTok/Reels but for discovering movies. Users can watch short clips, like movies to save them, and add them to a watchlist.

## User Flow
1.  **Authentication**:
    *   On launch, the app checks for a stored JWT token.
    *   **New Users**: specific Sign Up screen (`/signup`) to create an account.
    *   **Returning Users**: Login screen (`/login`) or auto-login if token exists.
2.  **Home Screen (`/(tabs)/home`)**:
    *   Displays a "Hero" movie with a featured trailer/clip.
    *   Horizontal rows of movies by category (Trending, Top 10, Genres).
    *   Tapping a movie opens the Player.
3.  **Video Player (`/player/[id]`)**:
    *   **The Core Experience**: Full-screen vertical video player.
    *   **Swiping**: Users swipe up/down to browse through clips of the selected movie.
    *   **Interaction**:
        *   **Like (Heart)**: Adds movie to "Liked Videos".
        *   **My List (Plus/Check)**: Adds movie to "Watchlist".
    *   **Smart Playback**: Only the visible clip plays; others pause automatically to save resources.
4.  **Movies Tab (`/(tabs)/movies`)**:
    *   Categorized view for deeper exploration of content.
5.  **Profile (`/(tabs)/profile`)**:
    *   Displays user information.
    *   Horizontal lists of "Liked Videos" and "My List".
    *   Settings and Sign Out options.

## Technical Architecture

### Tech Stack
- **Framework**: React Native with Expo.
- **Navigation**: `expo-router` for file-based routing.
- **Styling**: `react-native` StyleSheet (with plans for NativeWind).
- **Video**: `expo-av` for playback.
- **Icons**: `lucide-react-native`.

### State Management (Zustand)
Located in `src/lib/store.ts`.
- **Auth Store**: Manages `currentUser` and `token`. Handles login/logout logic.
- **Movies Store**: Fetches and caches the list of movies from the API.
- **User Lists**: Syncs Likes and Watchlist with the backend. Optimistically updates UI for instant feedback.

### Directory Structure
```
cineswipe-mobile/
├── app/                    # Screens & Routes
│   ├── (tabs)/             # Main Tab Bar (Home, Movies, Profile)
│   ├── player/             # Video Player Modal
│   ├── login.tsx           # Auth Screens
│   └── index.tsx           # Entry point / Redirect
├── src/
│   ├── lib/
│   │   ├── api.ts          # API Client (Fetch wrapper)
│   │   └── store.ts        # Global State (Zustand)
│   └── types/              # TypeScript Interfaces
```

## Key Features Implementation

### Vertical Swipe Player
Implemented in `app/player/[id].tsx`.
- Uses a `FlatList` with `pagingEnabled` for snap-scrolling.
- **Performance**:
    - `ClipPlayer` component optimizes individual video handling.
    - Videos are explicitly sized to `Dimensions.get('screen')`.
    - `pointerEvents="none"` on the video layer ensures touch events pass through to UI buttons overlaying the video.

### API Integration
Implemented in `src/lib/api.ts`.
- **Base URL**: Configured to localhost (dev).
- **Security**: JWT token is automatically attached to `Authorization` header for all requests.
- **Error Handling**: Centralized error catching in the store.
