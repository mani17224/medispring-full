// ============================================================
// FRONTEND INTEGRATION GUIDE
// Add these files to your MediSpring React frontend
// ============================================================

// ─── 1. src/lib/api.ts ──────────────────────────────────────
// Axios instance with auto token injection & refresh

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(api(original)));
        });
      }
      refreshing = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/refresh-token`,
          { refreshToken }
        );
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        queue.forEach((fn) => fn());
        queue = [];
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── 2. src/lib/auth.ts ─────────────────────────────────────
// Auth helpers

export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const isAuthenticated = () => !!localStorage.getItem("accessToken");

// ─── 3. src/hooks/useAuth.ts ────────────────────────────────
// Auth hook

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { saveTokens, clearTokens } from "../lib/auth";

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post("/auth/login", data).then((r) => r.data),
    onSuccess: (data) => {
      saveTokens(data.data.accessToken, data.data.refreshToken);
      qc.setQueryData(["profile"], data.data.user);
    },
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout").then((r) => r.data),
    onSettled: () => {
      clearTokens();
      qc.clear();
      window.location.href = "/login";
    },
  });
};

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get("/auth/profile").then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

// ─── 4. src/hooks/useDashboard.ts ───────────────────────────
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export const useDashboardStats = () =>
  useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/dashboard/stats").then((r) => r.data.data),
    refetchInterval: 60_000, // refresh every minute
  });

// ─── 5. src/hooks/useDoctors.ts ─────────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useDoctors = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["doctors", params],
    queryFn: () => api.get("/doctors", { params }).then((r) => r.data),
  });

export const useDoctor = (id: number) =>
  useQuery({
    queryKey: ["doctor", id],
    queryFn: () => api.get(`/doctors/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/doctors", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
  });
};

export const useUpdateDoctor = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.put(`/doctors/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["doctor", id] });
    },
  });
};

export const useDeleteDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/doctors/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
  });
};

// ─── 6. src/hooks/usePatients.ts ────────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const usePatients = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["patients", params],
    queryFn: () => api.get("/patients", { params }).then((r) => r.data),
  });

export const usePatient = (id: number) =>
  useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/patients", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};

export const useUpdatePatient = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.put(`/patients/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", id] });
    },
  });
};

// ─── 7. src/hooks/useAppointments.ts ────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useAppointments = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["appointments", params],
    queryFn: () => api.get("/appointments", { params }).then((r) => r.data),
  });

export const useTodayAppointments = () =>
  useQuery({
    queryKey: ["appointments-today"],
    queryFn: () => api.get("/appointments/today").then((r) => r.data.data),
    refetchInterval: 30_000,
  });

export const useBookAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/appointments", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments-today"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useUpdateAppointment = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.put(`/appointments/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
};

export const useCancelAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/appointments/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
};

// ─── 8. src/hooks/useBilling.ts ─────────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useBills = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["bills", params],
    queryFn: () => api.get("/billing", { params }).then((r) => r.data),
  });

export const useRevenueSummary = () =>
  useQuery({
    queryKey: ["revenue-summary"],
    queryFn: () => api.get("/billing/summary").then((r) => r.data.data),
  });

export const useCreateBill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/billing", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
    },
  });
};

export const useUpdateBill = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.put(`/billing/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
};

// ─── 9. src/hooks/useNotifications.ts ───────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useNotifications = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["notifications", params],
    queryFn: () => api.get("/notifications", { params }).then((r) => r.data),
    refetchInterval: 30_000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.put(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put("/notifications/mark-all-read").then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

// ─── 10. src/hooks/useAnalytics.ts ──────────────────────────
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export const useRevenueAnalytics = (year?: number) =>
  useQuery({
    queryKey: ["analytics-revenue", year],
    queryFn: () => api.get("/analytics/revenue", { params: { year } }).then((r) => r.data.data),
  });

export const usePatientAnalytics = (year?: number) =>
  useQuery({
    queryKey: ["analytics-patients", year],
    queryFn: () => api.get("/analytics/patients", { params: { year } }).then((r) => r.data.data),
  });

export const useAppointmentAnalytics = (year?: number) =>
  useQuery({
    queryKey: ["analytics-appointments", year],
    queryFn: () => api.get("/analytics/appointments", { params: { year } }).then((r) => r.data.data),
  });

// ─── 11. src/hooks/useBeds.ts ───────────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useWards = () =>
  useQuery({
    queryKey: ["wards"],
    queryFn: () => api.get("/beds/wards").then((r) => r.data.data),
  });

export const useBedSummary = () =>
  useQuery({
    queryKey: ["bed-summary"],
    queryFn: () => api.get("/beds/summary").then((r) => r.data.data),
    refetchInterval: 60_000,
  });

export const useBeds = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["beds", params],
    queryFn: () => api.get("/beds", { params }).then((r) => r.data),
  });

export const useAllocateBed = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.put(`/beds/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      qc.invalidateQueries({ queryKey: ["wards"] });
      qc.invalidateQueries({ queryKey: ["bed-summary"] });
    },
  });
};

// ─── 12. src/hooks/useLaboratory.ts ─────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useLabTests = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["lab-tests", params],
    queryFn: () => api.get("/laboratory", { params }).then((r) => r.data),
  });

export const useCreateLabTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/laboratory", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-tests"] }),
  });
};

export const useUpdateLabTest = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.put(`/laboratory/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-tests"] }),
  });
};

export const useUploadLabReport = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("report", file);
      return api.post(`/laboratory/${id}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-tests"] }),
  });
};

// ─── ADD TO FRONTEND .env ─────────────────────────────────
// VITE_API_URL=http://localhost:5000/api
