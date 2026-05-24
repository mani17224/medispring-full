import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FlaskConical, Plus, Loader2, Upload, Download, Search, X, FileText } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { useLabTests, useCreateLabTest, useUpdateLabTest, useDeleteLabTest, useUploadLabReport, useDoctors, usePatients } from "@/hooks/useApi";
import { downloadLabReportPDF, exportToCSV } from "@/lib/pdf";

export const Route = createFileRoute("/laboratory")({ component: Laboratory });

const statusTone: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  SAMPLE_COLLECTED: "bg-info/10 text-info",
  IN_PROGRESS: "bg-warning/15 text-warning",
  COMPLETED: "bg-success/10 text-success",
  CANCELLED: "bg-muted text-muted-foreground",
};

function Laboratory() {
  const [showForm, setShowForm] = useState(false);
  const [showResultModal, setShowResultModal] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ patientId: 0, doctorId: 0, testName: "", testCategory: "", notes: "" });
  const [resultForm, setResultForm] = useState({ testResult: "", normalRange: "", isCritical: false, notes: "" });

  const { data, isLoading } = useLabTests({ status: statusFilter || undefined, limit: 50 });
  const { data: patientData } = usePatients({ limit: 100 });
  const { data: doctorData } = useDoctors({ limit: 50 });
  const createTest = useCreateLabTest();
  const updateTest = useUpdateLabTest();
  const deleteTest = useDeleteLabTest();
  const uploadReport = useUploadLabReport();

  const allTests = data?.data ?? [];
  const tests = search
    ? allTests.filter((t) =>
        t.testName.toLowerCase().includes(search.toLowerCase()) ||
        `${t.patient?.firstName} ${t.patient?.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : allTests;
  const patients = patientData?.data ?? [];
  const doctors = doctorData?.data ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTest.mutateAsync(form as any);
    setShowForm(false);
    setForm({ patientId: 0, doctorId: 0, testName: "", testCategory: "", notes: "" });
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTest.mutateAsync({ id: showResultModal.id, ...resultForm, status: "COMPLETED", completedAt: new Date().toISOString() });
    setShowResultModal(null);
  };

  const handleDownloadPDF = (t: any) => {
    downloadLabReportPDF({
      testName: t.testName, testCategory: t.testCategory, testResult: t.testResult,
      normalRange: t.normalRange, isCritical: t.isCritical, status: t.status,
      completedAt: t.completedAt, notes: t.notes,
      patient: t.patient, doctor: t.doctor,
    });
  };

  const handleExportCSV = () => {
    exportToCSV(
      tests.map((t) => ({
        Patient: `${t.patient?.firstName ?? ""} ${t.patient?.lastName ?? ""}`,
        PatientID: t.patient?.patientId ?? "",
        Test: t.testName, Category: t.testCategory ?? "",
        Result: t.testResult ?? "", NormalRange: t.normalRange ?? "",
        Critical: t.isCritical ? "Yes" : "No",
        Status: t.status, Doctor: t.doctor?.name ?? "",
        Completed: t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "",
      })),
      "lab-tests-report"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory"
        description="Test bookings, sample tracking and report delivery."
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tests…"
                className="w-48 rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent focus:outline-none">
              <option value="">All Statuses</option>
              {["PENDING","SAMPLE_COLLECTED","IN_PROGRESS","COMPLETED","CANCELLED"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent">
              <Download className="h-4 w-4" /> Export
            </button>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
              <Plus className="h-4 w-4" /> Order Test
            </button>
          </>
        }
      />

      {/* ── Order Test Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Order Lab Test</h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient</label>
                <select value={form.patientId} onChange={(e) => setForm((p) => ({ ...p, patientId: +e.target.value }))} required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select patient…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ordering Doctor</label>
                <select value={form.doctorId} onChange={(e) => setForm((p) => ({ ...p, doctorId: +e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select doctor…</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Test Name</label>
                  <input value={form.testName} onChange={(e) => setForm((p) => ({ ...p, testName: e.target.value }))} required
                    placeholder="e.g. CBC, MRI Brain"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select value={form.testCategory} onChange={(e) => setForm((p) => ({ ...p, testCategory: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                    <option value="">Select…</option>
                    {["Hematology","Biochemistry","Radiology","Microbiology","Endocrine","Cardiac","Diabetes","Pathology","Immunology"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clinical Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Optional notes for lab staff…"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" disabled={createTest.isPending}
                  className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                  {createTest.isPending ? "Ordering…" : "Order Test"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Add Result Modal ── */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Add Test Result</h3>
              <button onClick={() => setShowResultModal(null)} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="font-semibold">{showResultModal.testName}</span>
              <span className="text-muted-foreground"> · {showResultModal.patient?.firstName} {showResultModal.patient?.lastName}</span>
            </div>
            <form onSubmit={handleSaveResult} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</label>
                <textarea value={resultForm.testResult} onChange={(e) => setResultForm((p) => ({ ...p, testResult: e.target.value }))} required rows={3}
                  placeholder="e.g. WBC: 8,500 | RBC: 4.9 | Hgb: 14.2"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Normal Range</label>
                <input value={resultForm.normalRange} onChange={(e) => setResultForm((p) => ({ ...p, normalRange: e.target.value }))}
                  placeholder="e.g. WBC 4,500–11,000 /μL"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Doctor Notes</label>
                <textarea value={resultForm.notes} onChange={(e) => setResultForm((p) => ({ ...p, notes: e.target.value }))} rows={2}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resultForm.isCritical} onChange={(e) => setResultForm((p) => ({ ...p, isCritical: e.target.checked }))}
                  className="h-4 w-4 rounded border-input" />
                <span className="text-sm font-medium text-destructive">Mark as Critical / Abnormal</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowResultModal(null)}
                  className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" disabled={updateTest.isPending}
                  className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                  {updateTest.isPending ? "Saving…" : "Save Result"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Total Tests", v: data?.meta?.total ?? 0, c: "text-foreground" },
          { l: "Pending / In-Progress", v: tests.filter((t) => ["PENDING","IN_PROGRESS","SAMPLE_COLLECTED"].includes(t.status)).length, c: "text-warning" },
          { l: "Critical", v: tests.filter((t) => t.isCritical).length, c: "text-destructive" },
          { l: "Completed", v: tests.filter((t) => t.status === "COMPLETED").length, c: "text-success" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-1"><FlaskConical className="h-4 w-4 text-muted-foreground" /></div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className={`font-display text-2xl font-bold ${s.c}`}>{s.v}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Tests Table ── */}
      <Card>
        <CardHeader title="Lab Tests" description="All orders, results and reports" />
        <CardBody className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["Patient","Test","Category","Critical","Result","Status","Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-accent/30">
                    <td className="px-5 py-3">
                      <div className="font-medium">{t.patient?.firstName} {t.patient?.lastName}</div>
                      <div className="text-xs text-muted-foreground">{t.patient?.patientId}</div>
                    </td>
                    <td className="px-5 py-3 font-semibold">{t.testName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t.testCategory ?? "—"}</td>
                    <td className="px-5 py-3">
                      {t.isCritical && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">⚠ Critical</span>
                      )}
                    </td>
                    <td className="px-5 py-3 max-w-[160px] truncate text-muted-foreground">{t.testResult ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusTone[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {/* Add / Edit result */}
                        {t.status !== "COMPLETED" && (
                          <button onClick={() => { setShowResultModal(t); setResultForm({ testResult: t.testResult ?? "", normalRange: t.normalRange ?? "", isCritical: t.isCritical, notes: t.notes ?? "" }); }}
                            className="text-xs font-semibold text-primary hover:underline">
                            {t.testResult ? "Edit" : "Add Result"}
                          </button>
                        )}
                        {/* PDF report download */}
                        {t.status === "COMPLETED" && (
                          <button onClick={() => handleDownloadPDF(t)} title="Download PDF"
                            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-primary">
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Upload PDF report file */}
                        <label className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-info" title="Upload report file">
                          <Upload className="h-3.5 w-3.5" />
                          <input type="file" className="hidden" accept=".pdf,.jpg,.png"
                            onChange={(e) => { if (e.target.files?.[0]) uploadReport.mutate({ id: t.id, file: e.target.files[0] }); }} />
                        </label>
                        {/* Delete */}
                        <button onClick={() => { if (confirm("Delete this test?")) deleteTest.mutate(t.id); }}
                          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tests.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No tests found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
