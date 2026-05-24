import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Video, Loader2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { useAppointments, useTodayAppointments, useBookAppointment, useUpdateAppointment, useDoctors, usePatients } from "@/hooks/useApi";

export const Route = createFileRoute("/appointments")({ component: Appointments });

const statusTone: Record<string, string> = {
  SCHEDULED: "bg-primary/10 text-primary", IN_PROGRESS: "bg-info/10 text-info",
  COMPLETED: "bg-success/10 text-success", CANCELLED: "bg-muted text-muted-foreground", NO_SHOW: "bg-warning/15 text-warning",
};

function Appointments() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: 0, doctorId: 0, appointmentDate: "", appointmentTime: "09:00", reason: "" });

  const { data: todayData, isLoading: todayLoading } = useTodayAppointments();
  const { data: allData, isLoading } = useAppointments({ limit: 20 });
  const { data: doctorData } = useDoctors({ limit: 50 });
  const { data: patientData } = usePatients({ limit: 50 });
  const bookAppointment = useBookAppointment();
  const updateAppointment = useUpdateAppointment();

  const today = todayData ?? [];
  const all = allData?.data ?? [];
  const doctors = doctorData?.data ?? [];
  const patients = patientData?.data ?? [];

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    await bookAppointment.mutateAsync(form);
    setShowForm(false);
    setForm({ patientId: 0, doctorId: 0, appointmentDate: "", appointmentTime: "09:00", reason: "" });
  };

  const hours = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => {
    const date = new Date(); date.setDate(date.getDate() - date.getDay() + i + 1);
    return `${d} ${date.getDate()}`;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Live calendar, queue management & video consults."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent">
              <Video className="h-4 w-4" /> Start tele-consult
            </button>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
              <Plus className="h-4 w-4" /> Book Appointment
            </button>
          </>
        }
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-elevated">
            <h3 className="font-display text-lg font-bold mb-4">Book Appointment</h3>
            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient</label>
                <select value={form.patientId} onChange={(e) => setForm((p) => ({ ...p, patientId: +e.target.value }))} required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select patient…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Doctor</label>
                <select value={form.doctorId} onChange={(e) => setForm((p) => ({ ...p, doctorId: +e.target.value }))} required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select doctor…</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} – {d.specialization}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</label>
                  <input type="date" value={form.appointmentDate} onChange={(e) => setForm((p) => ({ ...p, appointmentDate: e.target.value }))} required
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</label>
                  <select value={form.appointmentTime} onChange={(e) => setForm((p) => ({ ...p, appointmentTime: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                    {hours.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</label>
                <input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="e.g. General checkup"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" disabled={bookAppointment.isPending}
                  className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                  {bookAppointment.isPending ? "Booking…" : "Book"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader title="Weekly Schedule" description="Current week appointments"
            actions={<div className="flex items-center gap-1">
              <button className="rounded-md p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-2 text-sm font-medium">This week</span>
              <button className="rounded-md p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
            </div>}
          />
          <CardBody className="overflow-x-auto p-0">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-muted/30">
                <div />
                {days.map((d) => (
                  <div key={d} className="border-l border-border px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
                ))}
              </div>
              {hours.map((h, hi) => (
                <div key={h} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border last:border-b-0">
                  <div className="px-3 py-3 text-xs text-muted-foreground">{h}</div>
                  {days.map((_, di) => {
                    const appt = all.find((a) => {
                      const d = new Date(a.appointmentDate).getDay();
                      return (d === 0 ? 6 : d - 1) === di && a.appointmentTime === h;
                    });
                    return (
                      <div key={di} className="relative h-16 border-l border-border p-1.5">
                        {appt && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="h-full cursor-pointer rounded-lg p-1.5 text-[11px] leading-tight"
                            style={{ background: "color-mix(in oklab, var(--color-primary) 15%, transparent)", borderLeft: "3px solid var(--color-primary)" }}>
                            <div className="font-semibold">{appt.patient?.firstName} {appt.patient?.lastName?.[0]}.</div>
                            <div className="text-muted-foreground">{appt.doctor?.name}</div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Today's Queue" description={`${today.length} appointments`} />
          <CardBody className="space-y-3">
            {todayLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : today.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No appointments today</div>
            ) : today.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary text-xs font-bold text-white shrink-0">
                  {q.tokenNumber ?? `A-${i+1}`}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{q.patient?.firstName} {q.patient?.lastName}</div>
                  <div className="text-xs text-muted-foreground">{q.appointmentTime} · {q.doctor?.name}</div>
                </div>
                <span className={`shrink-0 h-2 w-2 rounded-full ${q.status === "IN_PROGRESS" ? "animate-pulse bg-success" : "bg-muted-foreground"}`} />
              </motion.div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="All Appointments" description="Full appointment list" />
        <CardBody className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {["Patient","Doctor","Date","Time","Reason","Status","Action"].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {all.map((a) => (
                  <tr key={a.id} className="hover:bg-accent/30">
                    <td className="px-5 py-3 font-medium">{a.patient?.firstName} {a.patient?.lastName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.doctor?.name}</td>
                    <td className="px-5 py-3">{new Date(a.appointmentDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3">{a.appointmentTime}</td>
                    <td className="px-5 py-3 text-muted-foreground max-w-[160px] truncate">{a.reason ?? "—"}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusTone[a.status] ?? "bg-muted text-muted-foreground"}`}>{a.status}</span></td>
                    <td className="px-5 py-3">
                      {a.status === "SCHEDULED" && (
                        <button onClick={() => updateAppointment.mutate({ id: a.id, status: "CANCELLED" })}
                          className="text-xs font-semibold text-destructive hover:underline">Cancel</button>
                      )}
                      {a.status === "IN_PROGRESS" && (
                        <button onClick={() => updateAppointment.mutate({ id: a.id, status: "COMPLETED" })}
                          className="text-xs font-semibold text-success hover:underline">Complete</button>
                      )}
                    </td>
                  </tr>
                ))}
                {all.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No appointments found</td></tr>}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
