# MediSpring — Windows Setup Guide

## Prerequisites
Install these first if you don't have them:
- **Node.js 18+**: https://nodejs.org (choose LTS)
- **MySQL 8**: https://dev.mysql.com/downloads/installer/
  - During install, set root password (remember it!)
  - Choose "Developer Default" setup type

---

## Backend Setup

### Step 1 — Create MySQL database
Open MySQL Workbench or Command Prompt:
```sql
mysql -u root -p
CREATE DATABASE medispring;
EXIT;
```

### Step 2 — Configure environment
```cmd
cd medispring-full\backend
copy .env.example .env
```
Open `.env` in Notepad and update these lines:
```
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/medispring"
JWT_SECRET=any_long_random_string_here_minimum_32_chars
JWT_REFRESH_SECRET=a_different_long_random_string_here
FRONTEND_URL=http://localhost:3000
```

### Step 3 — Install and setup
```cmd
npm install
npx prisma generate
npx prisma db push
node src/utils/seed.js
```

### Step 4 — Start backend
```cmd
npm run dev
```

You should see:
```
✅ MySQL connected via Prisma
🚀 MediSpring API running on port 5000 [development]
```

Test it: Open http://localhost:5000/api/health in browser — should show `{"success":true}`

---

## Frontend Setup

### Step 1 — Configure
```cmd
cd medispring-full\frontend
copy .env.example .env
```
`.env` should contain:
```
VITE_API_URL=http://localhost:5000/api
```

### Step 2 — Install and start
```cmd
npm install
npm run dev
```

Open http://localhost:3000

### Login credentials (after seeding):
| Email | Password | Role |
|-------|----------|------|
| admin@medispring.com | medispring123 | Admin |
| anjali@medispring.com | medispring123 | Doctor |

---

## Common Errors & Fixes

### `[nodemon] app crashed` with no message
Run `node src/server.js` directly instead of `npm run dev` to see the full error.

### `Error: Cannot connect to database`
- Make sure MySQL service is running: Open Services → MySQL80 → Start
- Check your DATABASE_URL password matches what you set during MySQL install
- Make sure database `medispring` exists (run Step 1 above)

### `Error: P1001: Can't reach database server`
MySQL is not running. Open Windows Services (Win+R → `services.msc`) and start **MySQL80**.

### `ENOENT: no such file or directory, open 'logs\error.log'`
This is fixed in the latest version. If you still see it, create a `logs` folder manually inside the `backend` folder.

### `Error: JWT_SECRET is not defined`
You haven't created `.env` yet, or it's missing the JWT_SECRET line. Run `copy .env.example .env` and fill in the values.

### `Cannot find module '@prisma/client'`
Run `npx prisma generate` again after `npm install`.

### Frontend shows no data / API errors
Make sure:
1. Backend is running on port 5000
2. `.env` in frontend has `VITE_API_URL=http://localhost:5000/api`
3. You're logged in (token stored in localStorage)

---

## Running both servers simultaneously
Open **two separate Command Prompt windows**:
- Window 1: `cd backend && npm run dev`
- Window 2: `cd frontend && npm run dev`
