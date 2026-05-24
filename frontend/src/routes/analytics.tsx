import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Brain, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { useRevenueAnalytics, usePatientAnalytics, useAppointmentAnalytics } from "@/hooks/useApi";

export const Route = createFileRoute("/analytics")({ component: Analytics });

const diseaseColors = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)"];
const diseases = [
  { name: "Cardiac", value: 320 }, { name: "Diabetes", value: 280 }, { name: "Respiratory", value: 240 },
  { name: "Orthopedic", value: 190 }, { name: "Cancer", value: 110 },
];
const heat = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => Math.round(Math.random() * 10)));
const dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function Analytics() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: revenue, isLoading: revLoading } = useRevenueAnalytics(year);
  const { data: patients, isLoading: patLoading } = usePatientAnalytics(year);
  const { data: appointments, isLoading: apptLoading } = useAppointmentAnalytics(year);

  const revenueChart = revenue ?? [];
  const patientChart = patients?.monthly ?? [];
  const apptChart = appointments?.monthly ?? [];
  const doctorPerf = appointments?.doctorPerformance ?? [];
  const riskDist = patients?.riskDistribution ?? {};
  const riskData = Object.entries(riskDist).map(([name, value]) => ({ name, value }));

  const totalRevenue = revenueChart.reduce((s: number, m: any) => s + m.revenue, 0);
  const totalPatients = patientChart.reduce((s: number, m: any) => s + m.patients, 0);
  const totalAppts = apptChart.reduce((s: number, m: any) => s + m.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Insights"
        description="Deep operational, clinical and financial analytics."
        actions={
          <div className="flex items-center gap-3">
            <select value={year} onChange={(e) => setYear(+e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none">
              {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
            </select>
            <button className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
              <Sparkles className="h-4 w-4" /> Run AI forecast
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: Brain, t: "High Risk Patients", v: String((riskDist as any).HIGH ?? 0 + ((riskDist as any).CRITICAL ?? 0)), d: "Critical + High risk", tone: "destructive" },
          { icon: TrendingUp, t: "Annual Revenue", v: `₹${(totalRevenue / 100000).toFixed(1)}L`, d: `${year} total collected`, tone: "success" },
          { icon: Sparkles, t: "Appointments", v: String(totalAppts), d: `${year} total bookings`, tone: "primary" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-xl bg-${s.tone}/10 text-${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.t}</div>
                <div className="font-display text-2xl font-bold">{s.v}</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue by Month" description={`${year} financial overview`} />
          <CardBody className="h-[320px]">
            {revLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
              <ResponsiveContainer>
                <AreaChart data={revenueChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="m" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Area dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Patient Risk Distribution" />
          <CardBody className="h-[320px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={riskData.length ? riskData : diseases} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {(riskData.length ? riskData : diseases).map((_: any, i: number) => <Cell key={i} fill={diseaseColors[i]} />)}
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
          <CardHeader title="Patient Growth" description={`Monthly new patients ${year}`} />
          <CardBody className="h-[280px]">
            {patLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
              <ResponsiveContainer>
                <BarChart data={patientChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="m" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="patients" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Doctor Performance" description="Completed appointments" />
          <CardBody className="h-[280px]">
            {apptLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
              <ResponsiveContainer>
                <BarChart data={doctorPerf.slice(0, 6)} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="appointmentsCompleted" fill="var(--color-primary)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Bed Occupancy Heatmap" description="By hour & day of week" />
        <CardBody>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex">
                <div className="w-10" />
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">{h}</div>
                ))}
              </div>
              {heat.map((row, di) => (
                <div key={di} className="mt-1 flex items-center">
                  <div className="w-10 text-[11px] font-semibold text-muted-foreground">{dayLabels[di]}</div>
                  {row.map((v, hi) => (
                    <div key={hi} className="m-[1.5px] h-6 flex-1 rounded" title={`${v * 10}% occupied`}
                      style={{ background: `color-mix(in oklab, var(--color-primary) ${v * 10}%, var(--color-muted))` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Low</span>
            <div className="h-2 w-32 rounded-full bg-gradient-to-r from-muted to-primary" />
            <span>High</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
