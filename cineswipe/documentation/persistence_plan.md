# Data Persistence Implementation Plan

Currently, CineSwipe is a **frontend-only prototype**. This means:
1. **User Accounts** are stored in the app's temporary memory (RAM). When you reload, the memory is cleared.
2. **Movies** are hardcoded in a static file (`mockData.ts`). You cannot "upload" new movies permanently because there is no server to receive them.

To make the app "remember" data (User Accounts, Uploaded Movies, Watchlists, Likes), you need to implement a full **Backend Infrastructure**.

## Required Components

### 1. The Database (The Brain)
You need a persistent database to store structured data.
*   **What it stores:**
    *   User details (Name, Email, Password Hash)
    *   Movie metadata (Title, Description, Genre, Duration)
    *   Relationships (Who liked what, who has what in their watchlist)
*   **Recommended Technologies:**
    *   **PostgreSQL** (SQL): Great for structured relationships.
    *   **MongoDB** (NoSQL): Flexible, good for handling varied data structures.
    *   **Supabase** or **Firebase**: "Backend-as-a-Service" options that provide a database + auth out of the box (easiest for mobile apps).

### 2. File Storage (The Vault)
Databases are for text and numbers. You cannot efficiently store large video files or images in them. You need dedicated Cloud Storage.
*   **What it stores:**
    *   Movie video files (.mp4)
    *   Thumbnail images (.jpg/.png)
    *   User avatars
*   **Recommended Technologies:**
    *   **AWS S3** (Amazon Simple Storage Service): Industry standard.
    *   **Google Cloud Storage**: Good integration with Google services.
    *   **Firebase Storage**: Very easy to integrate with mobile apps.
    *   **Cloudinary**: Great for image/video optimization on the fly.

### 3. The Backend API (The Traffic Controller)
You need a server that sits between your App (Frontend) and the Database/Storage.
*   **What it does:**
    *   **Security:** Checks if a user is allowed to upload a movie or view a profile.
    *   **Logic:** Handles "Signing Up" by taking the password, encrypting it, and saving it to the database.
    *   **Data Serving:** When the app asks for "Action Movies", the API queries the database and sends the list back as JSON.
*   **Recommended Technologies:**
    *   **Node.js** with **Express** or **NestJS** (since you are already using TypeScript/React).
    *   **Python** (Django or FastAPI).

## How "Upload" Would Work in the Real App

1.  **Admin Panel**: You select a video file on your computer.
2.  **Frontend**: The app sends the file to **AWS S3 (Storage)**.
3.  **Storage**: AWS S3 saves the file and gives back a unique URL (e.g., `https://s3.aws.com/my-bucket/movie1.mp4`).
4.  **Frontend**: The app takes that URL, plus the Title and Description, and sends it to your **Backend API**.
5.  **Backend API**: Receives the data, validates it, and saves a new row in the **Database**:
    *   `Title: "Inception"`
    *   `URL: "https://s3.aws.com/..."`
6.  **Mobile App**: When a user opens the app, it asks the API for the list of movies. The API reads the database (which now includes Inception) and sends it to the phone.

## Immediate Next Steps (If you wanted to build this)

1.  **Select a Stack:** For a React Native project, **Supabase** or **Firebase** is highly recommended as they combine Auth, Database, and Storage into one easy package.
2.  **Replace `mockData.ts`**: The app should fetch movies from an API endpoint (e.g., `v1/movies`) instead of reading a local array.
3.  **Replace `store.ts` auth logic**: The app should send login credentials to an API endpoint (e.g., `v1/auth/login`) and receive a secure token (JWT) to remember the user session.
