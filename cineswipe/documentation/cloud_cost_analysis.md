# Cloud Infrastructure & Cost Analysis

This document outlines the recommended cloud architecture for moving CineSwipe from a local development environment to a production-ready system. It provides a breakdown of necessary services, integration points, and estimated costs based on usage.

## 1. Recommended Architecture (AWS Stack)

We recommend using **Amazon Web Services (AWS)** for scalability and reliability.

| Component | Current (Dev) | Recommended (Prod) | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | SQLite (Local File) | **AWS RDS (PostgreSQL)** | Stores User accounts, Movie metadata, Likes, Watchlists. |
| **File Storage** | External URLs | **AWS S3** | Stores raw video files and thumbnail images uploaded by admins. |
| **Content Delivery** | Direct Links | **AWS CloudFront (CDN)** | Caches videos globally so they load instantly for users anywhere. |
| **API Server** | Localhost:3001 | **AWS App Runner / EC2** | Runs the Node.js/Express backend. |
| **Authentication** | Local JWT | **AWS Cognito** or Custom | managed auth (Optional - keeping current Custom JWT is fine). |

---

## 2. Integration Points

To move to the cloud, the following changes are needed in the code:

### A. Database (Switch to PostgreSQL)
*   **File**: `cineswipe-backend/prisma/schema.prisma`
    *   Change `provider = "sqlite"` to `provider = "postgresql"`.
*   **Env**: Update `DATABASE_URL` to point to the AWS RDS instance.

### B. Video Storage (S3 Uploads)
*   **New Feature**: Implement an "Admin Upload" API.
    *   Use `aws-sdk` to upload video files to an S3 Bucket.
*   **File**: `cineswipe-mobile/app/player/[id].tsx`
    *   The video player works as is! It just needs the new S3/CloudFront URLs.

---

## 3. Usage & Cost Breakdown

Costs are estimated based on **Monthly Active Users (MAU)** and video consumption.

**Assumptions per User:**
*   Watches 10 minutes of video per day (300 mins/month).
*   Video Bitrate: 2 Mbps (~15MB per minute).
*   Total Data Transfer: ~4.5 GB per user/month.

### Scenario A: Starter (1,000 Users)
*   **Storage**: 100 GB (Movies library) -> ~$2.30
*   **CDN Transfer**: 4.5 TB (4,500 GB) -> ~$380
*   **Database**: RDS db.t4g.micro -> ~$15
*   **Server**: App Runner -> ~$15
*   **Total Estimated Cost**: **~$412 / month**

### Scenario B: Growth (10,000 Users)
*   **Storage**: 500 GB -> ~$11.50
*   **CDN Transfer**: 45 TB -> ~$3,800
*   **Database**: RDS db.t4g.small -> ~$30
*   **Server**: App Runner (Scaled) -> ~$50
*   **Total Estimated Cost**: **~$3,900 / month**

> **💡 Cost Saving Tip**: CDN bandwidth is the biggest cost.
> 1.  **Reduce Bitrate**: Compressing videos to 720p/1Mbps cuts costs by **50%**.
> 2.  **Caching**: Aggressive caching policies reduce repeated fetches.

---

## 4. Alternative: Firebase (Simpler, potentially cheaper start)

For a faster launch, **Google Firebase** is an excellent alternative.

| Component | Service | Free Tier Limits |
| :--- | :--- | :--- |
| **Database** | Firestore | 1GB stored, 50k reads/day |
| **Storage** | Cloud Storage | 5GB stored, 1GB transfer/day |
| **Functions** | Cloud Functions | 2M invocations/month |

*   **Pros**: Much easier to set up. Excellent "Free Tier" for the first ~100 users.
*   **Cons**: Costs can spike unexpectedly at high scale compared to AWS fixed instances.

## 5. Summary Recommendation

1.  **Start with Firebase** for the MVP/Beta (First 500 users). It is free/cheap and fast to build.
2.  **Migrate to AWS** once you hit >1,000 users or have steady revenue, as you can optimize costs better with reserved instances and custom CDNs.
