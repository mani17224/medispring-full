# MediSpring Backend API 🏥

Production-ready REST API for the MediSpring Hospital Management System, built with Node.js + Express + MySQL + Prisma.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Database | MySQL 8.x |
| ORM | Prisma 5.x |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Password | bcryptjs |
| File uploads | Multer |
| Email | Nodemailer |
| Logging | Winston |
| Security | Helmet, express-rate-limit, CORS |

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MySQL 8.x running locally or on a cloud host

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secrets
```

**Key `.env` values:**
```env
DATABASE_URL="mysql://root:password@localhost:3306/medispring"
JWT_SECRET=change_this_to_a_long_random_string
JWT_REFRESH_SECRET=another_long_random_string
FRONTEND_URL=http://localhost:3000
```

### 4. Run Prisma migrations
```bash
npm run db:generate   # generate Prisma client
npm run db:migrate    # run migrations (creates tables)
```

### 5. Seed the database
```bash
npm run db:seed
```

This creates:
- Admin user: `admin@medispring.com` / `medispring123`
- 8 doctors with accounts
- 8 patients, appointments, bills, lab tests, notifications, wards, and beds

### 6. Start the server
```bash
npm run dev      # development with auto-reload
npm start        # production
```

API is available at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

### Standard Response Format
**Success:**
```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": { ... }
}
```
**Paginated:**
```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
**Error:**
```json
{
  "success": false,
  "message": "Something went wrong"
}
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

---

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login & get tokens |
| POST | `/api/auth/logout` | ✅ | Invalidate refresh token |
| POST | `/api/auth/refresh-token` | — | Get new access token |
| POST | `/api/auth/forgot-password` | — | Send reset email |
| POST | `/api/auth/reset-password` | — | Reset with token |
| GET | `/api/auth/profile` | ✅ | Get current user |

**Login request:**
```json
{ "email": "admin@medispring.com", "password": "medispring123" }
```
**Login response includes:**
```json
{
  "user": { "id": 1, "email": "...", "role": "ADMIN", ... },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | ✅ | All KPI stats |

---

### Doctors
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/doctors` | ✅ | All | List doctors |
| GET | `/api/doctors/specializations` | ✅ | All | Unique specializations |
| GET | `/api/doctors/:id` | ✅ | All | Doctor detail |
| POST | `/api/doctors` | ✅ | ADMIN | Create doctor |
| PUT | `/api/doctors/:id` | ✅ | ADMIN | Update doctor |
| DELETE | `/api/doctors/:id` | ✅ | ADMIN | Delete doctor |

**Query params:** `?search=cardio&specialization=Cardiology&status=AVAILABLE&page=1&limit=20&sortBy=rating&sortOrder=desc`

---

### Patients
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/patients` | ✅ | All | List patients |
| GET | `/api/patients/:id` | ✅ | All | Patient + history |
| POST | `/api/patients` | ✅ | ADMIN, RECEPTIONIST, DOCTOR | Create patient |
| PUT | `/api/patients/:id` | ✅ | ADMIN, RECEPTIONIST, DOCTOR | Update patient |
| DELETE | `/api/patients/:id` | ✅ | ADMIN | Soft delete |

**Query params:** `?search=aarav&riskLevel=HIGH&bloodGroup=O%2B&gender=Male`

---

### Appointments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/appointments` | ✅ | List appointments |
| GET | `/api/appointments/today` | ✅ | Today's appointments |
| GET | `/api/appointments/:id` | ✅ | Appointment detail |
| POST | `/api/appointments` | ✅ | Book appointment |
| PUT | `/api/appointments/:id` | ✅ | Update/reschedule |
| DELETE | `/api/appointments/:id` | ✅ | Cancel appointment |

**Query params:** `?doctorId=1&patientId=1&status=SCHEDULED&date=2026-05-19&dateFrom=2026-05-01&dateTo=2026-05-31`

---

### Billing
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/billing` | ✅ | List invoices |
| GET | `/api/billing/summary` | ✅ | Revenue summary |
| GET | `/api/billing/:id` | ✅ | Invoice detail |
| POST | `/api/billing` | ✅ | Create invoice |
| PUT | `/api/billing/:id` | ✅ | Update invoice/status |

---

### Laboratory
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/laboratory` | ✅ | List lab tests |
| GET | `/api/laboratory/:id` | ✅ | Test detail |
| POST | `/api/laboratory` | ✅ | Order test |
| PUT | `/api/laboratory/:id` | ✅ | Update results |
| DELETE | `/api/laboratory/:id` | ✅ | Delete test |
| POST | `/api/laboratory/:id/upload` | ✅ | Upload report PDF |

**Query params:** `?isCritical=true&status=COMPLETED&patientId=1`

---

### Beds
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/beds` | ✅ | List beds |
| GET | `/api/beds/summary` | ✅ | Occupancy summary |
| GET | `/api/beds/wards` | ✅ | Wards with stats |
| POST | `/api/beds/wards` | ✅ | Create ward |
| GET | `/api/beds/:id` | ✅ | Bed detail |
| POST | `/api/beds` | ✅ | Create bed |
| PUT | `/api/beds/:id` | ✅ | Allocate/update bed |
| DELETE | `/api/beds/:id` | ✅ | Delete bed |

---

### Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | ✅ | Get notifications |
| POST | `/api/notifications` | ✅ ADMIN | Create notification |
| PUT | `/api/notifications/mark-all-read` | ✅ | Mark all read |
| PUT | `/api/notifications/:id/read` | ✅ | Mark one read |

---

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/revenue` | ✅ | Monthly revenue chart data |
| GET | `/api/analytics/patients` | ✅ | Patient growth data |
| GET | `/api/analytics/appointments` | ✅ | Appointment stats |

**Query params:** `?year=2026`

---

## Roles & Permissions

| Role | Key Permissions |
|---|---|
| ADMIN | Full access to everything |
| DOCTOR | Read all, write appointments/labs/patients |
| RECEPTIONIST | Manage patients, appointments, billing |
| LABORATORY_STAFF | Manage lab tests, upload reports |
| PHARMACIST | View patients and prescriptions |
| PATIENT | View own records |

---

## Frontend Integration

### Axios base setup (add to your frontend)
```typescript
// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem("refreshToken");
      if (refresh) {
        try {
          const { data } = await axios.post("/api/auth/refresh-token", { refreshToken: refresh });
          localStorage.setItem("accessToken", data.data.accessToken);
          err.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(err.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
```

### Example TanStack Query usage
```typescript
// Fetch doctors with search
const { data } = useQuery({
  queryKey: ["doctors", search, specialization],
  queryFn: () => api.get("/doctors", { params: { search, specialization } }).then(r => r.data),
});

// Create patient
const mutation = useMutation({
  mutationFn: (data) => api.post("/patients", data).then(r => r.data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
});
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Deployment

### Railway / Render
1. Push backend to a Git repo
2. Create a new service, connect repo
3. Set environment variables (DATABASE_URL, JWT_SECRET, etc.)
4. Add start command: `npm start`
5. Run migrations: `npm run db:migrate:prod`

### Docker (optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["node", "src/server.js"]
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with nodemon |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run pending migrations (dev) |
| `npm run db:migrate:prod` | Deploy migrations (prod) |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio GUI |
