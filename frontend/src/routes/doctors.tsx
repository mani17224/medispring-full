import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Star, Calendar, Search, Filter, Loader2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDoctors, useCreateDoctor, useDeleteDoctor } from "@/hooks/useApi";

export const Route = createFileRoute("/doctors")({ component: Doctors });

const statusTone: Record<string, string> = {
  AVAILABLE: "bg-success/10 text-success", ON_CALL: "bg-info/10 text-info",
  IN_SURGERY: "bg-warning/15 text-warning", ON_LEAVE: "bg-muted text-muted-foreground", INACTIVE: "bg-muted text-muted-foreground",
};
const statusLabel: Record<string, string> = {
  AVAILABLE: "Available", ON_CALL: "On call", IN_SURGERY: "In surgery", ON_LEAVE: "On leave", INACTIVE: "Inactive",
};

function Doctors() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", specialization: "", experience: 0, email: "", consultationFee: 0, availability: "Mon-Fri" });

  const { data, isLoading } = useDoctors(search ? { search } : undefined);
  const createDoctor = useCreateDoctor();
  const deleteDoctor = useDeleteDoctor();

  const doctors = data?.data ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDoctor.mutateAsync(form);
    setShowForm(false);
    setForm({ name: "", specialization: "", experience: 0, email: "", consultationFee: 0, availability: "Mon-Fri" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description="Specialists, schedules and consultation rates."
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doctors…"
                className="w-56 rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
              <Plus className="h-4 w-4" /> Add Doctor
            </button>
          </>
        }
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-elevated">
            <h3 className="font-display text-lg font-bold mb-4">Add New Doctor</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: "Full Name", key: "name", type: "text" },
                { label: "Specialization", key: "specialization", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Experience (years)", key: "experience", type: "number" },
                { label: "Consultation Fee (₹)", key: "consultationFee", type: "number" },
                { label: "Availability", key: "availability", type: "text" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: f.type === "number" ? +e.target.value : e.target.value }))} required
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" disabled={createDoctor.isPending}
                  className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                  {createDoctor.isPending ? "Saving…" : "Add Doctor"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctors.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }} className="group rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-elevated transition-shadow">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl gradient-primary text-base font-bold text-white shrink-0">
                  {d.name.split(" ").filter((_, i) => i > 0).map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.specialization}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className={`rounded-full px-2 py-1 font-semibold ${statusTone[d.status] ?? "bg-muted text-muted-foreground"}`}>
                  {statusLabel[d.status] ?? d.status}
                </span>
                <div className="flex items-center gap-1 text-warning">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-semibold text-foreground">{Number(d.rating).toFixed(1)}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Exp</div>
                  <div className="text-sm font-bold">{d.experience}y</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Fee</div>
                  <div className="text-sm font-bold">₹{d.consultationFee}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Avail</div>
                  <div className="text-[10px] font-bold leading-tight">{d.availability ?? "—"}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {d.availability ?? "—"}</span>
                <button onClick={() => deleteDoctor.mutate(d.id)} className="font-semibold text-destructive hover:underline">Remove</button>
              </div>
            </motion.div>
          ))}
          {doctors.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">No doctors found</div>
          )}
        </div>
      )}
    </div>
  );
}
