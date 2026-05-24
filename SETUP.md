# MediSpring — Setup Guide (Fix CSS & Run)

## Why the previous version had no styling
The original project used **TanStack Start** (SSR framework) which loaded CSS through
a special `?url` import in `__root.tsx`. We converted it to a pure **Vite SPA**,
so CSS now loads through a direct `import "./styles.css"` in `main.tsx`.

All fixes are already applied in this version.

---

## Frontend — Run Locally

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Set API URL
cp .env.example .env
# Edit .env → VITE_API_URL=http://localhost:5000/api

# 3. Start dev server
npm run dev
# Opens at http://localhost:3000
```

> **Important:** Run the backend first so the API is available.

---

## Backend — Run Locally

```bash
cd backend

# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env → DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

# 3. Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Start
npm run dev
# API at http://localhost:5000
# Test: http://localhost:5000/api/health
```

**Login after seeding:**
- Email: `admin@medispring.com`
- Password: `medispring123`

---

## Key changes from original

| File | Change |
|---|---|
| `src/main.tsx` | NEW — SPA entry point, imports CSS + fonts |
| `src/router.tsx` | Updated — createAppRouter(queryClient) instead of TanStack Start |
| `src/routes/__root.tsx` | Removed SSR-only APIs (HeadContent, Scripts, shellComponent) |
| `vite.config.ts` | Replaced `@lovable.dev/vite-tanstack-config` with standard Vite plugins |
| `index.html` | NEW — standard Vite HTML entry |
| `src/lib/api.ts` | NEW — Axios instance with JWT auto-inject + refresh |
| `src/lib/auth.tsx` | NEW — AuthContext (login, logout, user state) |
| `src/hooks/useApi.ts` | NEW — all TanStack Query hooks |
| `src/routes/*.tsx` | All routes updated to use real API hooks |
| `src/components/layout/Sidebar.tsx` | Shows logged-in user, real logout |
| `src/components/layout/Topbar.tsx` | Real notification badge, user avatar |

---

## Build for Production

```bash
# Frontend
cd frontend && npm run build
# Output in frontend/dist/ — deploy to Vercel/Netlify

# Backend
cd backend && npm start
# Deploy to Railway/Render
```
