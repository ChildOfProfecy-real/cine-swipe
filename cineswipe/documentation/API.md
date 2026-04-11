# CineSwipe API Documentation — v2.0

## Base URL
```
http://localhost:3001
```

## Authentication
All protected endpoints require a `Bearer` token in the `Authorization` header.
Admin panel uses httpOnly cookies (`admin_token`) as fallback.

---

## Auth (`/auth`)
Rate limited: **5 requests/minute** per IP.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Create account |
| POST | `/auth/login` | ❌ | Login (sets httpOnly cookie for admins) |
| POST | `/auth/logout` | ❌ | Clear admin cookie |

### POST /auth/register
```json
{ "name": "User", "email": "user@email.com", "password": "secret123" }
```
Returns `{ message, token, user }`. Email validated for format.

### POST /auth/login
```json
{ "email": "admin@email.com", "password": "secret123" }
```
Returns `{ message, token, user }`. Sets `admin_token` httpOnly cookie if admin.

---

## Movies (`/movies`) — Public/Read-only

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/movies` | ❌ | List movies (paginated) |
| GET | `/movies/:id` | ❌ | Single movie with clips + comments |
| POST | `/movies/:id/comments` | ✅ | Add comment |

### GET /movies — Paginated
```
GET /movies?page=1&limit=20&genre=Action&search=batman
```
Response:
```json
{
  "movies": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 42,
    "totalPages": 3
  }
}
```
Defaults: `page=1`, `limit=20`, max `limit=50`.

---

## Admin (`/admin`) — Requires admin JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard stats |
| POST | `/admin/movies` | Create movie (multipart) |
| DELETE | `/admin/movies/:id` | Delete movie + storage |
| POST | `/admin/movies/:id/clips` | Add clip (multipart) |
| DELETE | `/admin/movies/:id/clips/:clipId` | Delete clip + renumber |
| PUT | `/admin/movies/:id/clips/:clipId` | Replace clip file |

### POST /admin/movies (multipart/form-data)
Fields: `title`, `description`, `genre`, `duration` (seconds)
Files: `thumbnail`, `hero`, `trailer`, `clip` (first clip, required)

### POST /admin/movies/:id/clips (multipart/form-data)
Fields: `duration` (seconds, optional)
Files: `clip` (required)

### DELETE /admin/movies/:id/clips/:clipId
- Deletes by clip **ID** (not sequence number)
- Auto-renumbers remaining clips (1..N)
- Cannot delete the last clip

### PUT /admin/movies/:id/clips/:clipId (multipart/form-data)
Fields: `duration` (seconds, optional)
Files: `clip` (required)
- Adds cache-busting `?v=timestamp` to new URL

---

## Users (`/users`) — Requires JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Current user profile |
| GET | `/users/me/likes` | Liked movies |
| POST | `/users/me/likes/:movieId` | Toggle like |
| GET | `/users/me/watchlist` | Watchlist movies |
| POST | `/users/me/watchlist/:movieId` | Toggle watchlist |
| GET | `/users/me/status/:movieId` | Like + watchlist status |
| POST | `/users/me/progress` | Save watch progress |
| GET | `/users/me/continue-watching` | Continue watching list |
| DELETE | `/users/me/progress/:movieId` | Clear watch progress |

---

## Storage Structure (Supabase)
```
media/
  movies/{movieId}/
    thumbnail.jpg
    hero.jpg
    trailer.mp4
    clips/
      clip1.mp4
      clip2.mp4
      ...
```
All clip operations use structured paths. Old flat-path files (`videos/`, `images/`) are legacy.

---

## Error Responses
| Code | Meaning |
|------|---------|
| 400 | Validation error (missing fields, invalid format) |
| 401 | `Authentication required. Please log in.` or `Session expired.` |
| 403 | `Admin access required.` |
| 404 | Resource not found |
| 429 | Rate limit exceeded (auth routes) |
| 500 | Internal server error |
