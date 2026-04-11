# CineSwipe Project Structure & Backend

## 1. Concept: The Big Picture
This document explains the foundation of our entire system.

Our app follows a **Client-Server Architecture**:
*   **The Client (Mobile App)**: This is what you see and touch on your phone. It displays pictures and buttons.
*   **The Server (Backend)**: This is the "brain" running on a computer. It has the database, checks passwords, and sends data to the app.

They talk to each other using **REST API** (HTTP requests). The App sends a "Request" (like "Get me movies"), and the Server sends a "Response".

## 2. Key Technology

### SQLite (The Database)
Think of this as a super-powered Excel file that lives on the server.
*   **Why?**: It's simple, fast, and doesn't require complex installation. Perfect for development.
*   **File**: `cineswipe-backend/prisma/dev.db`

### Prisma (The Translator)
Databases speak a complex language called SQL. Prisma allows us to talk to the database using simple code (TypeScript).
*   **It defines structure**: We tell Prisma "A User has a Name and Email".
*   **It manages changes**: When we want to add a new feature, Prisma updates the database structure for us.

### Express.js (The Manager)
This is the web server framework. It listens for requests from the mobile app and decides which function to run.

## 3. Folder Structure Overview

### Backend (`cineswipe-backend/`)
*   `src/index.ts`: **The Entry Point**. Starts the server.
*   `src/routes/`: **The Menu**. Lists all the things the server can do (Auth, Movies, Users).
*   `prisma/schema.prisma`: **The Blueprint**. Defines what our data looks like.
*   `prisma/seed.ts`: **The Starter Kit**. A script that fills an empty database with fake movies so you can test the app immediately.

### Mobile (`cineswipe-mobile/`)
*   `app/`: **The Screens**. Each file here is a screen in the app.
    *   `(tabs)/`: Screens with the bottom navigation bar (Home, Movies, Profile).
    *   `player/[id].tsx`: The video player screen.
*   `src/lib/api.ts`: **The Messenger**. Send messages to the backend.
*   `src/lib/store.ts`: **The Memory**. Remembers things like "Is the user logged in?" or "What movies did we load?".

## 4. How to Run Everything

You need two separate terminal windows because the Server and the App run independently.

**Terminal 1: The Backend**
```bash
cd cineswipe-backend
npm run dev
# This starts the server on http://localhost:3001
```

**Terminal 2: The Mobile App**
```bash
cd cineswipe-mobile
npx expo start --web
# This bundles the app and opens it in your browser/simulator on http://localhost:8081
```
