# 🚀 StudioSpace Server

> The secure backend server for **StudioSpace** — a modern workspace and studio rental platform built with **Express.js**, **Native MongoDB Atlas**, and **Better Auth (HTTPOnly Cookies)**.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Native MongoDB Driver & ObjectId)
- **Authentication:** Better Auth (`session_token`, `session_data` HTTPOnly Cookies)
- **Middleware:** `cookie-parser`, `cors`, `dotenv`

---

## ✨ Key Features & Architecture

- **🔐 Secure Authentication Middleware (`verifyAuth`):** Validates session tokens directly from HTTPOnly cookies against the MongoDB `session` and `user` collections, ensuring protected mutations return `401 Unauthorized` or `403 Forbidden` if invalid.
- **🛡️ CORS & Cookie Management:** Configured with `credentials: true` and `cookie-parser` for seamless cross-origin communication with the Next.js frontend (`http://localhost:3000`).
- **🏢 Studio Management APIs:** CRUD operations for studio listings (Add, Fetch All, Get by ID, Filter by Category, Update, and Delete).
- **📅 Double-Booking Prevention Logic:** Implements mathematical time-interval overlap validation (`$lt`, `$gt` operators) against confirmed reservations to prevent scheduling collisions.
- **📦 User-Specific Queries:** Secure endpoints to fetch user-specific listings (`/my-studios`) and bookings (`/bookings/:email`).

---

## 📁 Project Structure

```text
studio-space-server/
│
├── index.js          # Main Express server, database connection & routes
├── .env              # Environment variables (Port, Mongo URI, Secrets)
├── package.json      # Dependencies and scripts
└── README.md         # Project documentation
```
