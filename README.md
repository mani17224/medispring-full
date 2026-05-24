# MediSpring — Full Stack Hospital Management System

A complete, production-ready hospital management system built with:

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, TanStack Router, TanStack Query, Tailwind CSS 4, Vite |
| Backend | Node.js, Express.js, Prisma ORM, MySQL 8 |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Validation | Zod |
| File Uploads | Multer |
| Logging | Winston |
| Security | Helmet, express-rate-limit, CORS |

## Project Structure

```
medispring-full/
├── frontend/          ← React + Vite SPA
│   ├── src/
│   │   ├── routes/    ← All pages (login, dashboard, doctors, etc.)
│   │   ├── hooks/     ← useApi.ts — all TanStack Query hooks
│   │   ├── lib/       ← api.ts (axios), auth.tsx (AuthContext)
│   │   └── components/
│   └── .env.example
│
└── backend/           ← Express + Prisma API
    ├── src/
    │   ├── controllers/
    │   ├── routes/
    │   ├── middleware/
    │   ├── validators/
    │   └── utils/
    ├── prisma/schema.prisma
    └── .env.example
```

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # Fill in your MySQL credentials & JWT secrets
npm run db:generate
npm run db:migrate
npm run db:seed                # Creates demo data + admin user
npm run dev                    # Starts on http://localhost:5000
```

**Demo credentials after seeding:**
- Email: `admin@medispring.com`
- Password: `medispring123`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm run dev                    # Starts on http://localhost:3000
```

Open http://localhost:3000 → Login → Full hospital dashboard connected to your real API.

## Key Features

| Module | Features |
|---|---|
| Auth | JWT login/logout, refresh tokens, forgot/reset password, role-based access |
| Dashboard | Live KPI cards, revenue chart, bed occupancy, recent appointments |
| Doctors | CRUD, filter by specialization/status, rating, availability |
| Patients | CRUD, risk levels, blood group filter, search, soft delete |
| Appointments | Book, cancel, complete, calendar view, today's queue, slot conflict detection |
| Billing | Invoices, mark paid, revenue summary, payment status filter |
| Laboratory | Order tests, update results, upload PDF reports, critical flag |
| Beds & Wards | Ward occupancy grid, allocate/discharge patients, live bed status |
| Notifications | Real-time alerts, mark read/unread, unread badge in topbar |
| Analytics | Monthly revenue, patient growth, doctor performance charts |

## Deployment

See `backend/README.md` for full Railway + Vercel deployment guide.

**Short version:**
1. Push `backend/` to GitHub → Deploy on Railway (add MySQL service)
2. Push `frontend/` to GitHub → Deploy on Vercel (set `VITE_API_URL`)
3. Update `FRONTEND_URL` in Railway backend env to your Vercel URL

## API Endpoints

Full API documentation is in `backend/README.md`.

Base URL: `http://localhost:5000/api`

| Resource | Endpoints |
|---|---|
| Auth | POST /auth/login, register, logout, refresh-token, forgot-password |
| Dashboard | GET /dashboard/stats |
| Doctors | GET/POST/PUT/DELETE /doctors |
| Patients | GET/POST/PUT/DELETE /patients |
| Appointments | GET/POST/PUT/DELETE /appointments, GET /appointments/today |
| Billing | GET/POST/PUT /billing, GET /billing/summary |
| Laboratory | GET/POST/PUT/DELETE /laboratory, POST /laboratory/:id/upload |
| Beds | GET/POST/PUT/DELETE /beds, GET /beds/wards, GET /beds/summary |
| Notifications | GET/POST /notifications, PUT /notifications/mark-all-read |
| Analytics | GET /analytics/revenue, /analytics/patients, /analytics/appointments |
