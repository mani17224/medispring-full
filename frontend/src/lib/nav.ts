import {
  LayoutDashboard, Users, Stethoscope, CalendarDays, Receipt, Pill,
  FlaskConical, FileText, BedDouble, BarChart3, Bell, FileBarChart,
  Settings, LogOut,
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Patients", to: "/patients", icon: Users },
  { label: "Doctors", to: "/doctors", icon: Stethoscope },
  { label: "Appointments", to: "/appointments", icon: CalendarDays },
  { label: "Billing", to: "/billing", icon: Receipt },
  { label: "Pharmacy", to: "/pharmacy", icon: Pill },
  { label: "Laboratory", to: "/laboratory", icon: FlaskConical },
  { label: "Medical Records", to: "/records", icon: FileText },
  { label: "Bed Management", to: "/beds", icon: BedDouble },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Reports", to: "/reports", icon: FileBarChart },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

export const logoutItem = { label: "Logout", to: "/login", icon: LogOut };
