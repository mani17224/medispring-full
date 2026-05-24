import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BedDouble, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { useWards, useBedSummary, useUpdateBed, useDischarge, useBeds, usePatients } from "@/hooks/useApi";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/beds")({ component: Beds });

const bedStatusStyle: Record<string, string> = {
  FREE: "bg-success/20 border-success/50 text-success",
  OCCUPIED: "bg-primary/20 border-primary/50 text-primary",
  CLEANING: "bg-warning/20 border-warning/50 text-warning",
  MAINTENANCE: "bg-destructive/20 border-destructive/50 text-destructive",
  RESERVED: "bg-muted border-border text-muted-foreground",
};

function Beds() {
  const { data: wards, isLoading } = useWards();
  const { data: summary } = useBedSummary();
  const { data: bedData } = useBeds({ limit: 200 });
  const { data: patientData } = usePatients({ limit: 100 });
  const updateBed = useUpdateBed();
  const discharge = useDischarge();
  const qc = useQueryClient();

  // Allocate modal state
  const [showAllocate, setShowAllocate] = useState(false);
  const [allocForm, setAllocForm] = useState({ bedId: 0, patientId: 0 });

  // Add bed modal
  const [showAddBed, setShowAddBed] = useState(false);
  const [bedForm, setBedForm] = useState({ bedNumber: "", wardId: 0 });

  // Status change modal (click on bed)
  const [selectedBed, setSelectedBed] = useState<any>(null);

  const beds = bedData?.data ?? [];
  const patients = patientData?.data ?? [];
  const freeBeds = beds.filter((b) => b.status === "FREE");
  const occupiedBeds = beds.filter((b) => b.status === "OCCUPIED");

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocForm.bedId || !allocForm.patientId) return;
    await updateBed.mutateAsync({ id: allocForm.bedId, patientId: allocForm.patientId });
    setShowAllocate(false);
    setAllocForm({ bedId: 0, patientId: 0 });
  };

  const handleDischarge = async (bedId: number) => {
    if (!confirm("Discharge patient and free this bed?")) return;
    await discharge.mutateAsync(bedId);
    setSelectedBed(null);
  };

  const handleStatusChange = async (bedId: number, status: string) => {
    await updateBed.mutateAsync({ id: bedId, status } as any);
    setSelectedBed(null);
  };

  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/beds", bedForm);
    qc.invalidateQueries({ queryKey: ["wards"] });
    qc.invalidateQueries({ queryKey: ["beds"] });
    qc.invalidateQueries({ queryKey: ["bed-summary"] });
    setShowAddBed(false);
    setBedForm({ bedNumber: "", wardId: 0 });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bed & Ward Management"
        description="Live occupancy, allocations and ICU tracking."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowAddBed(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent">
              <Plus className="h-4 w-4" /> Add Bed
            </button>
            <button onClick={() => setShowAllocate(true)}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
              <BedDouble className="h-4 w-4" /> Allocate Bed
            </button>
          </div>
        }
      />

      {/* ── Allocate Bed Modal ── */}
      {showAllocate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Allocate Bed to Patient</h3>
              <button onClick={() => setShowAllocate(false)} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Free Bed</label>
                <select value={allocForm.bedId} onChange={(e) => setAllocForm((p) => ({ ...p, bedId: +e.target.value }))} required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select bed…</option>
                  {freeBeds.map((b) => (
                    <option key={b.id} value={b.id}>{b.bedNumber} — {b.ward?.name} ({b.ward?.type})</option>
                  ))}
                </select>
                {freeBeds.length === 0 && <p className="mt-1 text-xs text-destructive">No free beds available</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Patient</label>
                <select value={allocForm.patientId} onChange={(e) => setAllocForm((p) => ({ ...p, patientId: +e.target.value }))} required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAllocate(false)}
                  className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" disabled={updateBed.isPending || freeBeds.length === 0}
                  className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                  {updateBed.isPending ? "Allocating…" : "Allocate"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Add Bed Modal ── */}
      {showAddBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Add New Bed</h3>
              <button onClick={() => setShowAddBed(false)} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddBed} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bed Number</label>
                <input value={bedForm.bedNumber} onChange={(e) => setBedForm((p) => ({ ...p, bedNumber: e.target.value }))} required placeholder="e.g. GEN-41"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ward</label>
                <select value={bedForm.wardId} onChange={(e) => setBedForm((p) => ({ ...p, wardId: +e.target.value }))} required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select ward…</option>
                  {(wards ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddBed(false)}
                  className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit"
                  className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow">Add Bed</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Bed detail / status change modal ── */}
      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Bed {selectedBed.bedNumber}</h3>
              <button onClick={() => setSelectedBed(null)} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Ward</span><span className="font-medium">{selectedBed.ward?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${bedStatusStyle[selectedBed.status]}`}>{selectedBed.status}</span>
              </div>
              {selectedBed.patient && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Current Patient</div>
                  <div className="font-semibold">{selectedBed.patient?.firstName} {selectedBed.patient?.lastName}</div>
                  <div className="text-xs text-muted-foreground">{selectedBed.patient?.patientId}</div>
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {["FREE","CLEANING","MAINTENANCE","RESERVED"].map((s) => (
                <button key={s} onClick={() => handleStatusChange(selectedBed.id, s)} disabled={selectedBed.status === s}
                  className={`rounded-lg border py-2 text-xs font-semibold transition disabled:opacity-40 ${bedStatusStyle[s]}`}>
                  Set {s}
                </button>
              ))}
            </div>
            {selectedBed.status === "OCCUPIED" && (
              <button onClick={() => handleDischarge(selectedBed.id)}
                className="mt-3 w-full rounded-xl border border-destructive/30 bg-destructive/10 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20">
                Discharge Patient
              </button>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Total Beds", v: summary?.total ?? 0, c: "text-foreground" },
          { l: "Occupied", v: summary?.occupied ?? 0, c: "text-primary" },
          { l: "Available", v: summary?.free ?? 0, c: "text-success" },
          { l: "Cleaning / Maint.", v: (summary?.cleaning ?? 0), c: "text-warning" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className={`font-display text-2xl font-bold ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* ── Occupied Beds Table ── */}
      <Card>
        <CardHeader title="Currently Occupied Beds" description={`${occupiedBeds.length} beds in use`} />
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>{["Bed","Ward","Patient","Assigned","Action"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {occupiedBeds.map((b) => (
                <tr key={b.id} className="hover:bg-accent/30">
                  <td className="px-5 py-3 font-mono font-semibold">{b.bedNumber}</td>
                  <td className="px-5 py-3">{b.ward?.name}</td>
                  <td className="px-5 py-3">
                    {b.patient ? (
                      <div><div className="font-medium">{b.patient.firstName} {b.patient.lastName}</div>
                      <div className="text-xs text-muted-foreground">{b.patient.patientId}</div></div>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {b.assignedDate ? new Date(b.assignedDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDischarge(b.id)}
                      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20">
                      Discharge
                    </button>
                  </td>
                </tr>
              ))}
              {occupiedBeds.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No occupied beds</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* ── Ward Grid ── */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {(wards ?? []).map((w) => (
            <Card key={w.id}>
              <CardHeader title={w.name}
                description={`${w.total} beds · ${w.occupied} occupied · ${w.free} free`}
                actions={<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{w.type}</span>}
              />
              <CardBody>
                <div className="grid grid-cols-10 gap-1.5">
                  {(w.beds ?? []).map((bed, i) => {
                    const fullBed = beds.find((b) => b.id === bed.id);
                    return (
                      <motion.button key={bed.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.008 }}
                        onClick={() => fullBed && setSelectedBed(fullBed)}
                        title={`${bed.bedNumber} — ${bed.status}`}
                        className={`grid aspect-square place-items-center rounded-lg border text-[10px] font-bold hover:opacity-70 transition-opacity active:scale-95 ${bedStatusStyle[bed.status] ?? "bg-muted border-border"}`}>
                        {i + 1}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                  {Object.entries(bedStatusStyle).map(([status, cls]) => (
                    <span key={status} className={`rounded-full px-2 py-0.5 font-semibold border ${cls}`}>{status}</span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-border text-center text-sm">
                  <div><div className="text-xs text-muted-foreground">Occupied</div><div className="font-bold text-primary">{w.occupied}</div></div>
                  <div><div className="text-xs text-muted-foreground">Free</div><div className="font-bold text-success">{w.free}</div></div>
                  <div><div className="text-xs text-muted-foreground">Cleaning</div><div className="font-bold text-warning">{w.cleaning}</div></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
