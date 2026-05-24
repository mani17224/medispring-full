import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Filter, Plus, Search, MoreVertical, Phone, Loader2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { usePatients, useCreatePatient, useDeletePatient } from "@/hooks/useApi";

export const Route = createFileRoute("/patients")({ component: Patients });

const riskTone: Record<string, string> = {
  HIGH: "bg-destructive/10 text-destructive", CRITICAL: "bg-destructive/10 text-destructive",
  MEDIUM: "bg-warning/15 text-warning", LOW: "bg-success/10 text-success",
};

function Patients() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", gender: "Male", age: 0, phone: "", email: "", bloodGroup: "", currentCondition: "", riskLevel: "LOW" });

  const { data, isLoading } = usePatients({ search: search || undefined, riskLevel: riskFilter || undefined, limit: 50 });
  const createPatient = useCreatePatient();
  const deletePatient = useDeletePatient();

  const patients = data?.data ?? [];
  const meta = data?.meta;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPatient.mutateAsync(form);
    setShowForm(false);
    setForm({ firstName: "", lastName: "", gender: "Male", age: 0, phone: "", email: "", bloodGroup: "", currentCondition: "", riskLevel: "LOW" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Manage patient records, history & care plans."
        actions={
          <>
            <div className="flex gap-2">
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent focus:outline-none">
                <option value="">All Risk Levels</option>
                {["LOW","MEDIUM","HIGH","CRITICAL"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
              <Plus className="h-4 w-4" /> Add Patient
            </button>
          </>
        }
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-bold mb-4">Add New Patient</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[{ l: "First Name", k: "firstName" }, { l: "Last Name", k: "lastName" }].map((f) => (
                  <div key={f.k}>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.l}</label>
                    <input value={(form as any)[f.k]} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} required
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                    {["Male","Female","Other"].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age</label>
                  <input type="number" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: +e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
              </div>
              {[{ l: "Phone", k: "phone", t: "tel" }, { l: "Email", k: "email", t: "email" }, { l: "Current Condition", k: "currentCondition", t: "text" }].map((f) => (
                <div key={f.k}>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.l}</label>
                  <input type={f.t} value={(form as any)[f.k]} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blood Group</label>
                  <select value={form.bloodGroup} onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                    <option value="">Unknown</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</label>
                  <select value={form.riskLevel} onChange={(e) => setForm((p) => ({ ...p, riskLevel: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                    {["LOW","MEDIUM","HIGH","CRITICAL"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" disabled={createPatient.isPending}
                  className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                  {createPatient.isPending ? "Saving…" : "Add Patient"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Total", v: meta?.total?.toLocaleString() ?? "—" },
          { l: "High Risk", v: patients.filter((p) => p.riskLevel === "HIGH" || p.riskLevel === "CRITICAL").length },
          { l: "This page", v: patients.length },
          { l: "Avg. Age", v: patients.length > 0 ? Math.round(patients.reduce((s, p) => s + (p.age ?? 0), 0) / patients.length) : "—" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className="mt-1 font-display text-2xl font-bold">{s.v}</div>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader title="All Patients" description="Search, filter and manage records"
          actions={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient…"
                className="w-64 rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
          }
        />
        <CardBody className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  {["Patient","ID","Age / Gender","Blood","Contact","Condition","Risk","Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-xs font-semibold text-white shrink-0">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold">{p.firstName} {p.lastName}</div>
                          <div className="text-xs text-muted-foreground">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{p.patientId}</td>
                    <td className="px-5 py-3">{p.age ?? "—"} · {p.gender[0]}</td>
                    <td className="px-5 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{p.bloodGroup ?? "—"}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {p.phone}</div>
                    </td>
                    <td className="px-5 py-3">{p.currentCondition ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${riskTone[p.riskLevel] ?? "bg-muted text-muted-foreground"}`}>{p.riskLevel}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => deletePatient.mutate(p.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">No patients found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
