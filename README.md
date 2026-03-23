# ⬡ MentorBridge — Full Stack AI Mentorship Platform

> Production-ready full-stack application: React + Node.js + Express + MongoDB + Socket.io + OpenAI

---

## 🚀 Quick Start

### 1. Clone and install
```bash
# Install root deps
npm install

# Install all (client + server)
npm run install:all
```

### 2. Configure environment
```bash
cd server
cp .env.example .env
# Edit .env — add MONGO_URI, JWT_SECRET, OPENAI_API_KEY
```

### 3. Seed demo data
```bash
cd server
node seed.js
```

### 4. Run dev servers
```bash
# From root — runs both client + server concurrently
npm run dev

# Or separately:
cd server && npm run dev   # → http://localhost:5000
cd client && npm run dev   # → http://localhost:5173
```

### Demo credentials
| Role   | Email                      | Password  |
|--------|----------------------------|-----------|
| Mentee | demo@mentorbridge.io        | demo123   |
| Mentor | priya@demo.com             | demo123   |

---

## 📁 Project Structure

```
mentorbridge/
├── client/                     # React (Vite) frontend
│   └── src/
│       ├── components/
│       │   ├── layout/          # AppLayout, Sidebar, Topbar
│       │   ├── ui/              # Input, Select, Modal, EmptyState, StatCard
│       │   └── shared/          # LoadingScreen
│       ├── context/
│       │   ├── AuthContext.jsx  # JWT auth state, rehydration
│       │   └── SocketContext.jsx# Socket.io context + online users
│       ├── hooks/
│       │   └── index.js         # useDebounce, useLocalStorage, useFetch, useClickOutside
│       ├── pages/
│       │   ├── LandingPage      # Marketing homepage
│       │   ├── LoginPage        # Auth with validation
│       │   ├── RegisterPage     # Role-based registration
│       │   ├── DashboardPage    # AI search + mentor recs + stats
│       │   ├── MentorsPage      # Browse + filter + bookmark mentors
│       │   ├── ProfilePage      # Mentor detail + connection request modal
│       │   ├── ChatPage         # Real-time Socket.io chat
│       │   ├── RoadmapPage      # AI roadmap generator + progress tracker
│       │   ├── ProgressPage     # Analytics + milestone tracking
│       │   └── SettingsPage     # Profile, security, notifications
│       └── services/
│           ├── api.js           # Axios instance + JWT interceptors
│           └── index.js         # authService, mentorService, aiService…
│
└── server/                     # Node.js + Express backend
    ├── index.js                 # HTTP server + Socket.io init
    ├── app.js                   # Express app, middleware, routes
    ├── seed.js                  # Demo data seeder
    ├── config/
    │   └── db.js                # MongoDB connection
    ├── models/
    │   ├── User.js              # User (mentor/mentee), bcrypt, JWT
    │   ├── Message.js           # Chat messages with conversationId
    │   ├── Connection.js        # Mentor-mentee relationships
    │   ├── Review.js            # Ratings + auto-recalculate
    │   └── Roadmap.js           # AI roadmaps with step tracking
    ├── controllers/
    │   ├── authController.js    # register, login, me, updateMe
    │   ├── mentorController.js  # list, getById, matches, bookmark, review
    │   ├── messageController.js # conversations, messages, send
    │   ├── connectionController.js # request, respond, list
    │   ├── aiController.js      # search, roadmap, chat, updateStep
    │   └── notificationController.js
    ├── middleware/
    │   ├── authMiddleware.js    # JWT protect + RBAC authorize
    │   ├── errorMiddleware.js   # Global error handler
    │   └── validate.js          # express-validator middleware
    ├── routes/                  # One file per resource
    └── services/
        └── socketService.js     # Socket.io: auth, messaging, typing, presence
```

---

## ✅ Features Implemented

### Backend
- [x] JWT Authentication (register, login, protected routes)
- [x] Role-based access control (mentor / mentee / admin)
- [x] bcrypt password hashing (salt rounds: 12)
- [x] MongoDB with Mongoose (5 models, indexes, virtuals)
- [x] MVC architecture (controllers / routes / services / middleware)
- [x] Global error handler (CastError, duplicate key, validation)
- [x] Rate limiting (express-rate-limit)
- [x] Security headers (helmet, CORS)
- [x] Socket.io real-time chat with JWT auth
- [x] Typing indicators + online/offline presence
- [x] OpenAI integration (search analysis, roadmap generation, AI chat)
- [x] Graceful AI fallback (works without API key)
- [x] Mentor matching algorithm (skill overlap scoring)
- [x] Review system with auto rating recalculation
- [x] Notification system (embedded in user document)
- [x] DB seed script with demo data
- [x] Input validation (express-validator)

### Frontend
- [x] React 18 + Vite
- [x] React Router v6 (protected routes, public routes)
- [x] AuthContext with server rehydration
- [x] SocketContext for real-time features
- [x] Axios with JWT request interceptors + 401 redirect
- [x] useDebounce hook (search performance)
- [x] Landing page (hero, stats, features, CTA)
- [x] Login/Register with full validation
- [x] Dashboard (AI search, mentor cards, stats, quick actions)
- [x] Mentors browse page (search, domain filter, sort, verified filter)
- [x] Mentor profile page (connection request modal)
- [x] Real-time chat (Socket.io, typing indicators)
- [x] AI Roadmap generator + step completion tracking
- [x] Progress analytics page
- [x] Settings (profile update, password change, notification prefs)
- [x] Skeleton loaders, loading states, error states
- [x] Dark design system with CSS variables
- [x] Fully responsive (mobile-ready)

---

## 🔌 API Reference

| Method | Endpoint                          | Auth | Description             |
|--------|-----------------------------------|------|-------------------------|
| POST   | /api/auth/register                | —    | Register user           |
| POST   | /api/auth/login                   | —    | Login                   |
| GET    | /api/auth/me                      | ✓    | Get profile             |
| PUT    | /api/auth/me                      | ✓    | Update profile          |
| GET    | /api/mentors                      | —    | List mentors + filters  |
| GET    | /api/mentors/matches              | ✓    | AI-matched mentors      |
| GET    | /api/mentors/:id                  | —    | Mentor + reviews        |
| POST   | /api/mentors/:id/bookmark         | ✓    | Toggle bookmark         |
| POST   | /api/mentors/:id/reviews          | ✓    | Add review              |
| GET    | /api/messages/conversations       | ✓    | All conversations       |
| GET    | /api/messages/:userId             | ✓    | Chat messages           |
| POST   | /api/connections                  | ✓    | Send request            |
| PUT    | /api/connections/:id              | ✓    | Accept/reject           |
| POST   | /api/ai/search                    | ✓    | AI intent search        |
| POST   | /api/ai/roadmap                   | ✓    | Generate roadmap        |
| POST   | /api/ai/chat                      | ✓    | AI assistant            |
| GET    | /api/ai/roadmaps                  | ✓    | User roadmaps           |
| PUT    | /api/ai/roadmaps/:id/steps/:sid   | ✓    | Mark step complete      |

---

## 🚢 Deployment

### Render
1. Create Web Service → connect repo → root dir: `server`
2. Build command: `npm install`
3. Start command: `node index.js`
4. Add env vars from `.env.example`

### Vercel (client)
1. Import repo → root dir: `client`
2. Set `VITE_API_URL` to your Render backend URL

### MongoDB Atlas
Replace `MONGO_URI` in `.env` with your Atlas connection string.
