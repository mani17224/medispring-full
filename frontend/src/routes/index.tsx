import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, BedDouble, CalendarCheck, HeartPulse, Receipt, Stethoscope, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { useDashboardStats, useRevenueAnalytics } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth";
import { exportDashboardReport } from "@/lib/pdf";

export const Route = createFileRoute("/")({ component: Dashboard });

const spark = (n: number) => Array.from({ length: 12 }, (_, i) => Math.round(n + Math.sin(i) * (n * 0.15) + Math.random() * (n * 0.1)));

const deptColors = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)"];
const departments = [
  { name: "Cardiology", value: 32 }, { name: "Neurology", value: 22 },
  { name: "Orthopedics", value: 18 }, { name: "Pediatrics", value: 15 }, { name: "Oncology", value: 13 },
];
const statusTone: Record<string, string> = {
  COMPLETED: "bg-success/10 text-success", IN_PROGRESS: "bg-info/10 text-info",
  SCHEDULED: "bg-primary/10 text-primary", NO_SHOW: "bg-warning/15 text-warning",
};

function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: revenueData } = useRevenueAnalytics(new Date().getFullYear());

  const revenueChart = revenueData?.map((r: any) => ({ m: r.m, revenue: r.revenue, expenses: Math.round(r.revenue * 0.55) })) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user ? `${user.firstName} ${user.lastName}` : "Doctor"} 👋`}
        description="Here's what's happening across MediSpring today."
        actions={
          <>
            <button className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent">Last 30 days</button>
            <button onClick={() => exportDashboardReport(stats)} className="rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">Export report</button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Patients" value={isLoading ? "…" : stats?.patients.total.toLocaleString() ?? "0"} delta={12.4} icon={Users} tone="primary" data={spark(120)} index={0} />
        <StatCard label="Today Appointments" value={isLoading ? "…" : String(stats?.appointments.today ?? 0)} delta={8.1} icon={CalendarCheck} tone="info" data={spark(80)} index={1} />
        <StatCard label="Doctors Available" value={isLoading ? "…" : String(stats?.doctors.available ?? 0)} delta={3.2} icon={Stethoscope} tone="success" data={spark(50)} index={2} />
        <StatCard label="Monthly Revenue" value={isLoading ? "…" : `₹${((stats?.revenue.monthly ?? 0) / 1000).toFixed(1)}k`} delta={18.7} icon={Receipt} tone="primary" data={spark(160)} index={3} />
        <StatCard label="Outstanding Bills" value={isLoading ? "…" : `₹${((stats?.revenue.outstanding ?? 0) / 1000).toFixed(1)}k`} delta={-4.5} icon={Receipt} tone="warning" data={spark(70)} index={4} />
        <StatCard label="High Risk Patients" value={isLoading ? "…" : String(stats?.patients.highRisk ?? 0)} delta={6.0} icon={HeartPulse} tone="destructive" data={spark(30)} index={5} />
        <StatCard label="Bed Availability" value={isLoading ? "…" : `${stats?.beds.available ?? 0} / ${stats?.beds.total ?? 0}`} delta={-2.1} icon={BedDouble} tone="info" data={spark(90)} index={6} />
        <StatCard label="ICU Occupied" value={isLoading ? "…" : String(stats?.beds.icu ?? 0)} delta={22.0} icon={AlertTriangle} tone="destructive" data={spark(20)} index={7} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue & Expenses" description="Monthly financial overview" />
          <CardBody className="h-[320px]">
            <ResponsiveContainer>
              <AreaChart data={revenueChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#rev)" />
                <Area type="monotone" dataKey="expenses" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#exp)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Department Mix" description="Active patients by dept." />
          <CardBody className="h-[320px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={departments} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {departments.map((_, i) => <Cell key={i} fill={deptColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent Patient Activities" description="Latest visits & consultations"
            actions={<button className="text-xs font-semibold text-primary hover:underline">View all</button>} />
          <CardBody className="p-0">
            <div className="divide-y divide-border">
              {(stats?.appointments.recent ?? []).map((r: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/40">
                  <div className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-sm font-semibold text-white">
                    {r.patient?.firstName?.[0]}{r.patient?.lastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{r.patient?.firstName} {r.patient?.lastName}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{r.appointmentTime}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.reason} · {r.doctor?.name}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone[r.status] ?? "bg-muted text-muted-foreground"}`}>{r.status}</span>
                </motion.div>
              ))}
              {(!stats?.appointments.recent || stats.appointments.recent.length === 0) && !isLoading && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No recent appointments</div>
              )}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Bed Occupancy" description="Live ward status" />
          <CardBody className="space-y-4">
            {[
              { name: "ICU", used: stats?.beds.icu ?? 0, total: 24 },
              { name: "General", used: (stats?.beds.occupied ?? 0) - (stats?.beds.icu ?? 0), total: 80 },
              { name: "Available", used: stats?.beds.available ?? 0, total: stats?.beds.total ?? 192 },
            ].map((w) => {
              const pct = w.total > 0 ? Math.round((w.used / w.total) * 100) : 0;
              return (
                <div key={w.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{w.name}</span>
                    <span className="text-muted-foreground">{w.used}/{w.total}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full gradient-primary" />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
