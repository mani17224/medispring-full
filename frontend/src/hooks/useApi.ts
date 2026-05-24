// src/hooks/useApi.ts
// All TanStack Query hooks for MediSpring API

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean };
}

export interface Doctor {
  id: number; name: string; specialization: string; qualification?: string;
  experience: number; consultationFee: number; availability?: string;
  rating: number; image?: string; status: string; email: string; phone?: string; bio?: string;
}

export interface Patient {
  id: number; patientId: string; firstName: string; lastName: string;
  gender: string; age?: number; bloodGroup?: string; phone: string;
  email?: string; address?: string; currentCondition?: string; riskLevel: string;
  medicalHistory?: string; emergencyContact?: string; createdAt: string;
}

export interface Appointment {
  id: number; patientId: number; doctorId: number;
  appointmentDate: string; appointmentTime: string; reason?: string;
  status: string; notes?: string; tokenNumber?: string; isTelemedicine: boolean;
  patient?: Pick<Patient, "patientId" | "firstName" | "lastName" | "phone">;
  doctor?: Pick<Doctor, "name" | "specialization">;
}

export interface Bill {
  id: number; invoiceNumber: string; patientId: number; appointmentId?: number;
  amount: number; discount: number; tax: number; totalAmount: number;
  paymentMethod: string; paymentStatus: string; dueDate?: string; paidAt?: string;
  items?: any[]; createdAt: string;
  patient?: Pick<Patient, "patientId" | "firstName" | "lastName">;
}

export interface LabTest {
  id: number; patientId: number; doctorId?: number;
  testName: string; testCategory?: string; testResult?: string;
  normalRange?: string; isCritical: boolean; reportFile?: string;
  status: string; scheduledAt?: string; completedAt?: string; notes?: string;
  patient?: Pick<Patient, "patientId" | "firstName" | "lastName">;
  doctor?: Pick<Doctor, "name" | "specialization">;
}

export interface Bed {
  id: number; bedNumber: string; wardId: number; patientId?: number;
  status: string; assignedDate?: string; dischargeDate?: string;
  ward?: { name: string; type: string };
  patient?: Pick<Patient, "patientId" | "firstName" | "lastName">;
}

export interface Ward {
  id: number; name: string; type: string; capacity: number;
  total: number; occupied: number; free: number; cleaning: number;
  beds: { id: number; status: string; bedNumber: string }[];
}

export interface Notification {
  id: number; userId?: number; title: string; message: string;
  type: string; isRead: boolean; metadata?: any; createdAt: string;
}

export interface DashboardStats {
  patients: { total: number; highRisk: number };
  doctors: { total: number; available: number };
  appointments: { today: number; pending: number; recent: Appointment[] };
  beds: { total: number; occupied: number; available: number; icu: number };
  revenue: { monthly: number; outstanding: number };
  notifications: { unread: number };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const useDashboardStats = () =>
  useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/dashboard/stats").then((r) => r.data.data),
    refetchInterval: 60_000,
  });

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get("/auth/profile").then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

// ─── Doctors ─────────────────────────────────────────────────────────────────

export const useDoctors = (params?: Record<string, any>) =>
  useQuery<PaginatedResponse<Doctor>>({
    queryKey: ["doctors", params],
    queryFn: () => api.get("/doctors", { params }).then((r) => r.data),
  });

export const useDoctor = (id: number) =>
  useQuery<Doctor>({
    queryKey: ["doctor", id],
    queryFn: () => api.get(`/doctors/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useSpecializations = () =>
  useQuery<{ name: string; count: number }[]>({
    queryKey: ["specializations"],
    queryFn: () => api.get("/doctors/specializations").then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

export const useCreateDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Doctor>) => api.post("/doctors", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
  });
};

export const useUpdateDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Doctor> & { id: number }) =>
      api.put(`/doctors/${id}`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
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

// ─── Patients ─────────────────────────────────────────────────────────────────

export const usePatients = (params?: Record<string, any>) =>
  useQuery<PaginatedResponse<Patient>>({
    queryKey: ["patients", params],
    queryFn: () => api.get("/patients", { params }).then((r) => r.data),
  });

export const usePatient = (id: number) =>
  useQuery<Patient>({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Patient>) => api.post("/patients", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useUpdatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Patient> & { id: number }) =>
      api.put(`/patients/${id}`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", id] });
    },
  });
};

export const useDeletePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/patients/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const useAppointments = (params?: Record<string, any>) =>
  useQuery<PaginatedResponse<Appointment>>({
    queryKey: ["appointments", params],
    queryFn: () => api.get("/appointments", { params }).then((r) => r.data),
  });

export const useTodayAppointments = () =>
  useQuery<Appointment[]>({
    queryKey: ["appointments-today"],
    queryFn: () => api.get("/appointments/today").then((r) => r.data.data),
    refetchInterval: 30_000,
  });

export const useBookAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Appointment>) => api.post("/appointments", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments-today"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useUpdateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Appointment> & { id: number }) =>
      api.put(`/appointments/${id}`, data).then((r) => r.data),
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

// ─── Billing ─────────────────────────────────────────────────────────────────

export const useBills = (params?: Record<string, any>) =>
  useQuery<PaginatedResponse<Bill>>({
    queryKey: ["bills", params],
    queryFn: () => api.get("/billing", { params }).then((r) => r.data),
  });

export const useRevenueSummary = () =>
  useQuery<{ revenueThisMonth: number; outstanding: number; pendingCount: number }>({
    queryKey: ["revenue-summary"],
    queryFn: () => api.get("/billing/summary").then((r) => r.data.data),
  });

export const useCreateBill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Bill>) => api.post("/billing", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useUpdateBill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Bill> & { id: number }) =>
      api.put(`/billing/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
    },
  });
};

// ─── Laboratory ───────────────────────────────────────────────────────────────

export const useLabTests = (params?: Record<string, any>) =>
  useQuery<PaginatedResponse<LabTest>>({
    queryKey: ["lab-tests", params],
    queryFn: () => api.get("/laboratory", { params }).then((r) => r.data),
  });

export const useCreateLabTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LabTest>) => api.post("/laboratory", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-tests"] }),
  });
};

export const useUpdateLabTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<LabTest> & { id: number }) =>
      api.put(`/laboratory/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-tests"] }),
  });
};

export const useDeleteLabTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/laboratory/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-tests"] }),
  });
};

export const useUploadLabReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const form = new FormData();
      form.append("report", file);
      return api.post(`/laboratory/${id}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-tests"] }),
  });
};

// ─── Beds ─────────────────────────────────────────────────────────────────────

export const useWards = () =>
  useQuery<Ward[]>({
    queryKey: ["wards"],
    queryFn: () => api.get("/beds/wards").then((r) => r.data.data),
  });

export const useBedSummary = () =>
  useQuery<{ total: number; occupied: number; free: number; cleaning: number }>({
    queryKey: ["bed-summary"],
    queryFn: () => api.get("/beds/summary").then((r) => r.data.data),
    refetchInterval: 60_000,
  });

export const useBeds = (params?: Record<string, any>) =>
  useQuery<PaginatedResponse<Bed>>({
    queryKey: ["beds", params],
    queryFn: () => api.get("/beds", { params }).then((r) => r.data),
  });

export const useUpdateBed = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Bed> & { id: number }) =>
      api.put(`/beds/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      qc.invalidateQueries({ queryKey: ["wards"] });
      qc.invalidateQueries({ queryKey: ["bed-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};


export const useDischarge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bedId: number) => api.post(`/beds/${bedId}/discharge`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      qc.invalidateQueries({ queryKey: ["wards"] });
      qc.invalidateQueries({ queryKey: ["bed-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const useNotifications = (params?: Record<string, any>) =>
  useQuery<PaginatedResponse<Notification>>({
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

// ─── Analytics ────────────────────────────────────────────────────────────────

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

// ─── Users (Admin) ────────────────────────────────────────────────────────────

export interface UserRecord {
  id: number; firstName: string; lastName: string; email: string;
  phone?: string; role: string; isActive: boolean; createdAt: string;
}

export const useUsers = (params?: Record<string, any>) =>
  useQuery<PaginatedResponse<UserRecord>>({
    queryKey: ["users", params],
    queryFn: () => api.get("/users", { params }).then((r) => r.data),
  });

export const usePendingUsers = () =>
  useQuery<{ success: boolean; data: UserRecord[] }>({
    queryKey: ["users-pending"],
    queryFn: () => api.get("/users/pending").then((r) => r.data),
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserRecord> & { password: string }) =>
      api.post("/users", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<UserRecord> & { id: number }) =>
      api.put(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useActivateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.put(`/users/${id}/activate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users-pending"] });
    },
  });
};

export const useRequestAccount = () =>
  useMutation({
    mutationFn: (data: {
      firstName: string; lastName: string; email: string; password: string;
      phone?: string; role: string; department?: string; licenseId?: string;
    }) => api.post("/users/request", data).then((r) => r.data),
  });
