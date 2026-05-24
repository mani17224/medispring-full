import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileText, Plus, Search, Upload, Download, X, Loader2, Filter } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { usePatients, usePatient, useLabTests } from "@/hooks/useApi";
import { exportToCSV } from "@/lib/pdf";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/records")({ component: Records });

const recordTypes = ["Discharge Summary","Prescription","Diagnosis","Lab Report","X-Ray","MRI","Consent Form","Insurance Form","Treatment Plan","Surgery Notes"];
const tones: Record<string, string> = {
  "Lab Report": "bg-info/10 text-info", "X-Ray": "bg-warning/15 text-warning",
  "MRI": "bg-warning/15 text-warning", "Prescription": "bg-success/10 text-success",
  "Discharge Summary": "bg-primary/10 text-primary", "Diagnosis": "bg-primary/10 text-primary",
  "Consent Form": "bg-muted text-muted-foreground", "Treatment Plan": "bg-success/10 text-success",
};

function Records() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ patientId: 0, recordType: "Diagnosis", title: "", notes: "", file: null as File | null });
  const [uploading, setUploading] = useState(false);

  const qc = useQueryClient();
  const { data: patientData, isLoading: patientsLoading } = usePatients({ search: search || undefined, limit: 50 });
  const { data: selectedPatient } = usePatient(selectedPatientId ?? 0);
  const { data: labData } = useLabTests({ patientId: selectedPatientId ?? undefined, limit: 20 });

  const patients = patientData?.data ?? [];
  const labTests = labData?.data ?? [];

  // Derive "records" from appointments + lab tests for the selected patient
  const patientRecords = [
    ...(selectedPatient?.appointments ?? []).map((a: any) => ({
      id: `appt-${a.id}`, type: "Consultation", title: `Appointment – ${a.doctor?.name ?? "Doctor"}`,
      subtitle: `${new Date(a.appointmentDate).toLocaleDateString()} · ${a.status}`,
      meta: a.status, tone: "bg-primary/10 text-primary",
    })),
    ...labTests.map((t) => ({
      id: `lab-${t.id}`, type: "Lab Report", title: t.testName,
      subtitle: `${t.testCategory ?? "Lab"} · ${t.status}`,
      meta: t.isCritical ? "CRITICAL" : t.status,
      tone: t.isCritical ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info",
      reportFile: t.reportFile,
    })),
    ...(selectedPatient?.bills ?? []).map((b: any) => ({
      id: `bill-${b.id}`, type: "Invoice", title: `Invoice ${b.invoiceNumber}`,
      subtitle: `₹${Number(b.totalAmount).toLocaleString()} · ${b.paymentStatus}`,
      meta: b.paymentStatus, tone: "bg-success/10 text-success",
    })),
  ].filter((r) => !typeFilter || r.type === typeFilter);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.patientId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("report", uploadForm.file);
      // Find a matching lab test to attach to, or just upload standalone
      const matchingTest = labTests.find((t) => t.patientId === uploadForm.patientId);
      if (matchingTest) {
        await api.post(`/laboratory/${matchingTest.id}/upload`, form, { headers: { "Content-Type": "multipart/form-data" } });
      }
      qc.invalidateQueries({ queryKey: ["lab-tests"] });
      setShowUpload(false);
      setUploadForm({ patientId: 0, recordType: "Diagnosis", title: "", notes: "", file: null });
    } finally {
      setUploading(false);
    }
  };

  const handleExport = () => {
    exportToCSV(
      patients.map((p) => ({
        PatientID: p.patientId, Name: `${p.firstName} ${p.lastName}`,
        Gender: p.gender, Age: p.age ?? "", BloodGroup: p.bloodGroup ?? "",
        Phone: p.phone, Email: p.email ?? "", Condition: p.currentCondition ?? "",
        RiskLevel: p.riskLevel, Registered: new Date(p.createdAt).toLocaleDateString(),
      })),
      "medical-records"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Records (EMR)"
        description="Complete patient history, prescriptions, diagnoses and clinical notes."
        actions={
          <>
            <button onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
              <Upload className="h-4 w-4" /> Upload Record
            </button>
          </>
        }
      />

      {/* ── Upload Record Modal ── */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Upload Medical Record</h3>
              <button onClick={() => setShowUpload(false)} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient</label>
                <select value={uploadForm.patientId} onChange={(e) => setUploadForm((p) => ({ ...p, patientId: +e.target.value }))} required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select patient…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Record Type</label>
                <select value={uploadForm.recordType} onChange={(e) => setUploadForm((p) => ({ ...p, recordType: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  {recordTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title / Description</label>
                <input value={uploadForm.title} onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Cardiac MRI Report — May 2026"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
                <textarea value={uploadForm.notes} onChange={(e) => setUploadForm((p) => ({ ...p, notes: e.target.value }))} rows={2}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">File (PDF / Image)</label>
                <div className={`mt-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${uploadForm.file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  {uploadForm.file ? (
                    <div className="text-sm font-medium text-primary">{uploadForm.file.name} <button type="button" onClick={() => setUploadForm((p) => ({ ...p, file: null }))} className="ml-2 text-destructive">✕</button></div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
                    </>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" required className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(e) => e.target.files?.[0] && setUploadForm((p) => ({ ...p, file: e.target.files![0] }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" disabled={uploading}
                  className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Total Patients", v: patientData?.meta?.total ?? 0 },
          { l: "Lab Tests", v: labData?.meta?.total ?? 0 },
          { l: "High Risk", v: patients.filter((p) => ["HIGH","CRITICAL"].includes(p.riskLevel)).length },
          { l: "Loaded Records", v: patientRecords.length },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className="mt-1 font-display text-2xl font-bold">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Patient List ── */}
        <Card>
          <CardHeader title="Patients" description="Select to view records"
            actions={
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                  className="w-36 rounded-lg border border-input bg-background py-1.5 pl-8 pr-2 text-xs focus:outline-none" />
              </div>
            }
          />
          <CardBody className="p-0">
            {patientsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : (
              <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                {patients.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPatientId(p.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors ${selectedPatientId === p.id ? "bg-primary/10" : ""}`}>
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-primary text-xs font-bold text-white">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-muted-foreground">{p.patientId} · {p.currentCondition ?? "—"}</div>
                    </div>
                  </button>
                ))}
                {patients.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No patients found</div>}
              </div>
            )}
          </CardBody>
        </Card>

        {/* ── Record Detail ── */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Select a patient"}
            description={selectedPatient ? `${selectedPatient.patientId} · ${selectedPatient.currentCondition ?? "No condition recorded"}` : "Click a patient to view their records"}
            actions={selectedPatient && (
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs focus:outline-none">
                <option value="">All Types</option>
                {["Consultation","Lab Report","Invoice"].map((t) => <option key={t}>{t}</option>)}
              </select>
            )}
          />
          <CardBody className="p-0">
            {!selectedPatientId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
                <FileText className="h-10 w-10 opacity-30" />
                <p className="text-sm">Select a patient from the list to view their medical records</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                {/* Patient info bar */}
                {selectedPatient && (
                  <div className="grid grid-cols-4 gap-3 px-5 py-4 bg-muted/30 text-xs">
                    {[
                      { l: "Age", v: selectedPatient.age ?? "—" },
                      { l: "Blood", v: selectedPatient.bloodGroup ?? "—" },
                      { l: "Gender", v: selectedPatient.gender },
                      { l: "Risk", v: selectedPatient.riskLevel },
                    ].map((s) => (
                      <div key={s.l}><div className="text-muted-foreground">{s.l}</div><div className="font-semibold">{s.v}</div></div>
                    ))}
                  </div>
                )}
                {patientRecords.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${r.tone}`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.subtitle}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.tone}`}>{r.meta}</span>
                    {(r as any).reportFile && (
                      <a href={(r as any).reportFile} target="_blank" rel="noreferrer"
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-primary">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </motion.div>
                ))}
                {patientRecords.length === 0 && (
                  <div className="py-10 text-center text-sm text-muted-foreground">No records found for this patient</div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
