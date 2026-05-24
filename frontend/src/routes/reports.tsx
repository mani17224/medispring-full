import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, FileText, TrendingUp, Users, BedDouble, Receipt, Printer } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useDashboardStats, useRevenueAnalytics, usePatientAnalytics, useAppointmentAnalytics } from "@/hooks/useApi";
import { exportToCSV, exportDashboardReport } from "@/lib/pdf";

export const Route = createFileRoute("/reports")({ component: Reports });

const deptColors = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)"];

function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const { data: stats } = useDashboardStats();
  const { data: revenue } = useRevenueAnalytics(year);
  const { data: patients } = usePatientAnalytics(year);
  const { data: appointments } = useAppointmentAnalytics(year);

  const revenueChart = revenue ?? [];
  const patientChart = patients?.monthly ?? [];
  const apptChart = appointments?.monthly ?? [];
  const riskData = patients?.riskDistribution
    ? Object.entries(patients.riskDistribution).map(([name, value]) => ({ name, value }))
    : [{ name: "LOW", value: 0 }];

  // ── Export helpers ─────────────────────────────────────────────────────────
  const exportRevenue = () => exportToCSV(
    revenueChart.map((r: any) => ({ Month: r.m, Revenue: r.revenue })),
    `revenue-report-${year}`
  );

  const exportPatients = () => exportToCSV(
    patientChart.map((r: any) => ({ Month: r.m, NewPatients: r.patients })),
    `patient-growth-${year}`
  );

  const exportAppointments = () => exportToCSV(
    apptChart.map((r: any) => ({ Month: r.m, Total: r.total, Completed: r.completed, Cancelled: r.cancelled })),
    `appointments-report-${year}`
  );

  const exportDoctorPerf = () => exportToCSV(
    (appointments?.doctorPerformance ?? []).map((d: any) => ({
      Doctor: d.name, Specialization: d.specialization,
      AppointmentsCompleted: d.appointmentsCompleted, Rating: d.rating,
    })),
    `doctor-performance-${year}`
  );

  const reportCards = [
    {
      id: "revenue", icon: Receipt, title: "Revenue Report", description: "Monthly income, collections and outstanding amounts",
      color: "primary", value: `₹${((stats?.revenue.monthly ?? 0) / 1000).toFixed(1)}k`, label: "This month",
      onExport: exportRevenue,
    },
    {
      id: "patients", icon: Users, title: "Patient Report", description: "Admissions, demographics and risk levels",
      color: "info", value: String(stats?.patients.total ?? 0), label: "Total patients",
      onExport: exportPatients,
    },
    {
      id: "appointments", icon: TrendingUp, title: "Appointment Report", description: "Booking trends, cancellations and doctor loads",
      color: "success", value: String(stats?.appointments.today ?? 0), label: "Today's appointments",
      onExport: exportAppointments,
    },
    {
      id: "beds", icon: BedDouble, title: "Bed Occupancy Report", description: "Ward-wise utilisation and ICU stats",
      color: "warning", value: `${stats?.beds.occupied ?? 0}/${stats?.beds.total ?? 0}`, label: "Beds occupied",
      onExport: () => exportToCSV([{
        TotalBeds: stats?.beds.total ?? 0, Occupied: stats?.beds.occupied ?? 0,
        Available: stats?.beds.available ?? 0, ICU: stats?.beds.icu ?? 0,
      }], "bed-occupancy-report"),
    },
    {
      id: "doctors", icon: FileText, title: "Doctor Performance", description: "Completed appointments and patient ratings",
      color: "primary", value: String(stats?.doctors.total ?? 0), label: "Total doctors",
      onExport: exportDoctorPerf,
    },
    {
      id: "dashboard", icon: FileText, title: "Full Dashboard Report", description: "Combined KPI snapshot — print ready",
      color: "success", value: "PDF", label: "Printable report",
      onExport: () => exportDashboardReport(stats),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate, preview and export hospital performance reports."
        actions={
          <div className="flex items-center gap-2">
            <select value={year} onChange={(e) => setYear(+e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none">
              {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
            </select>
            <button onClick={() => exportDashboardReport(stats)}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
              <Printer className="h-4 w-4" /> Print Dashboard
            </button>
          </div>
        }
      />

      {/* ── Report Cards Grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reportCards.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`rounded-2xl border bg-card p-5 shadow-soft cursor-pointer transition-shadow hover:shadow-elevated ${activeReport === r.id ? "border-primary/40 ring-2 ring-primary/20" : "border-border"}`}
            onClick={() => setActiveReport(activeReport === r.id ? null : r.id)}>
            <div className="flex items-start justify-between gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-xl bg-${r.color}/10 text-${r.color} shrink-0`}>
                <r.icon className="h-5 w-5" />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); r.onExport(); }}
                className="rounded-lg border border-border p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3">
              <div className="font-semibold">{r.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className={`font-display text-2xl font-bold text-${r.color}`}>{r.value}</div>
              <div className="text-xs text-muted-foreground">{r.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Preview Charts (expand on click) ── */}
      {activeReport === "revenue" && (
        <Card>
          <CardHeader title="Revenue Report Preview" description={`Monthly revenue ${year}`}
            actions={<button onClick={exportRevenue} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"><Download className="h-3.5 w-3.5" />Export CSV</button>} />
          <CardBody className="h-[320px]">
            <ResponsiveContainer>
              <BarChart data={revenueChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {activeReport === "patients" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Patient Growth" description={`Monthly new registrations ${year}`}
              actions={<button onClick={exportPatients} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"><Download className="h-3.5 w-3.5" />Export CSV</button>} />
            <CardBody className="h-[280px]">
              <ResponsiveContainer>
                <LineChart data={patientChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="m" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="patients" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={{ fill: "var(--color-chart-3)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Risk Distribution" />
            <CardBody className="h-[280px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {riskData.map((_: any, i: number) => <Cell key={i} fill={deptColors[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}

      {activeReport === "appointments" && (
        <Card>
          <CardHeader title="Appointment Report Preview" description={`Monthly breakdown ${year}`}
            actions={<button onClick={exportAppointments} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"><Download className="h-3.5 w-3.5" />Export CSV</button>} />
          <CardBody className="h-[320px]">
            <ResponsiveContainer>
              <BarChart data={apptChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="cancelled" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} name="Cancelled" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {activeReport === "doctors" && (
        <Card>
          <CardHeader title="Doctor Performance" description="Top doctors by completed appointments"
            actions={<button onClick={exportDoctorPerf} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"><Download className="h-3.5 w-3.5" />Export CSV</button>} />
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["Doctor","Specialization","Appointments Completed","Rating"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(appointments?.doctorPerformance ?? []).map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-accent/30">
                    <td className="px-5 py-3 font-semibold">{d.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{d.specialization}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (d.appointmentsCompleted / 20) * 100)}%` }} />
                        </div>
                        <span className="font-bold">{d.appointmentsCompleted}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">⭐ {Number(d.rating ?? 0).toFixed(1)}</td>
                  </tr>
                ))}
                {(!appointments?.doctorPerformance || appointments.doctorPerformance.length === 0) && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No data — mark some appointments as COMPLETED first</td></tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {/* ── Summary table ── */}
      <Card>
        <CardHeader title="Quick Stats Summary" description="Current hospital snapshot"
          actions={
            <button onClick={() => exportDashboardReport(stats)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
              <Printer className="h-3.5 w-3.5" />Print PDF
            </button>
          }
        />
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-3 font-medium">Metric</th><th className="px-5 py-3 font-medium">Value</th><th className="px-5 py-3 font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { m: "Total Patients", v: stats?.patients.total ?? 0, s: "good" },
                { m: "High Risk Patients", v: stats?.patients.highRisk ?? 0, s: "warn" },
                { m: "Doctors Available", v: stats?.doctors.available ?? 0, s: "good" },
                { m: "Today's Appointments", v: stats?.appointments.today ?? 0, s: "info" },
                { m: "Beds Available", v: stats?.beds.available ?? 0, s: stats?.beds.available === 0 ? "bad" : "good" },
                { m: "ICU Occupied", v: stats?.beds.icu ?? 0, s: "warn" },
                { m: "Monthly Revenue", v: `₹${Number(stats?.revenue.monthly ?? 0).toLocaleString()}`, s: "good" },
                { m: "Outstanding Bills", v: `₹${Number(stats?.revenue.outstanding ?? 0).toLocaleString()}`, s: "warn" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-accent/30">
                  <td className="px-5 py-3 font-medium">{row.m}</td>
                  <td className="px-5 py-3 font-bold">{row.v}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      row.s === "good" ? "bg-success/10 text-success" :
                      row.s === "warn" ? "bg-warning/15 text-warning" :
                      row.s === "bad" ? "bg-destructive/10 text-destructive" :
                      "bg-info/10 text-info"}`}>
                      {row.s === "good" ? "Normal" : row.s === "warn" ? "Attention" : row.s === "bad" ? "Critical" : "Info"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
