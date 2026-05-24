import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, Plus, Printer, Loader2, Search, FileText } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { useBills, useRevenueSummary, useCreateBill, useUpdateBill, usePatients } from "@/hooks/useApi";
import { downloadInvoicePDF, exportToCSV } from "@/lib/pdf";

export const Route = createFileRoute("/billing")({ component: Billing });

const statusTone: Record<string, string> = {
  PAID: "bg-success/10 text-success",
  PENDING: "bg-warning/15 text-warning",
  OVERDUE: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
};

function Billing() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientId: 0, amount: 0, discount: 0, tax: 0,
    paymentMethod: "CASH" as const, paymentStatus: "PENDING" as const,
    notes: "", items: [] as { description: string; quantity: number; unitPrice: number }[],
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [itemLine, setItemLine] = useState({ description: "", quantity: 1, unitPrice: 0 });

  const { data, isLoading } = useBills({ paymentStatus: statusFilter || undefined, limit: 30 });
  const { data: summary } = useRevenueSummary();
  const { data: patientData } = usePatients({ limit: 100 });
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();

  const allBills = data?.data ?? [];
  const bills = search
    ? allBills.filter((b) =>
        b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        `${b.patient?.firstName} ${b.patient?.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : allBills;
  const patients = patientData?.data ?? [];

  const addItem = () => {
    if (!itemLine.description || itemLine.unitPrice <= 0) return;
    setForm((p) => ({
      ...p,
      items: [...p.items, { ...itemLine }],
      amount: p.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) + itemLine.quantity * itemLine.unitPrice,
    }));
    setItemLine({ description: "", quantity: 1, unitPrice: 0 });
  };

  const removeItem = (idx: number) => {
    const next = form.items.filter((_, i) => i !== idx);
    setForm((p) => ({ ...p, items: next, amount: next.reduce((s, i) => s + i.quantity * i.unitPrice, 0) }));
  };

  const calcTotal = () => form.amount - form.discount + form.tax;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBill.mutateAsync({ ...form, totalAmount: calcTotal() } as any);
    setShowForm(false);
    setForm({ patientId: 0, amount: 0, discount: 0, tax: 0, paymentMethod: "CASH", paymentStatus: "PENDING", notes: "", items: [] });
  };

  const handleDownloadPDF = (inv: any) => {
    const patient = patients.find((p) => p.id === inv.patientId) ?? inv.patient;
    downloadInvoicePDF({
      invoiceNumber: inv.invoiceNumber,
      patientName: `${inv.patient?.firstName ?? patient?.firstName ?? ""} ${inv.patient?.lastName ?? patient?.lastName ?? ""}`,
      patientId: inv.patient?.patientId ?? patient?.patientId ?? "",
      createdAt: inv.createdAt,
      paymentMethod: inv.paymentMethod,
      paymentStatus: inv.paymentStatus,
      items: inv.items ?? [],
      amount: Number(inv.amount),
      discount: Number(inv.discount ?? 0),
      tax: Number(inv.tax ?? 0),
      totalAmount: Number(inv.totalAmount),
    });
  };

  const handleExportCSV = () => {
    exportToCSV(
      bills.map((b) => ({
        Invoice: b.invoiceNumber,
        Patient: `${b.patient?.firstName ?? ""} ${b.patient?.lastName ?? ""}`,
        Date: new Date(b.createdAt).toLocaleDateString(),
        Amount: b.amount,
        Discount: b.discount,
        Tax: b.tax,
        Total: b.totalAmount,
        Method: b.paymentMethod,
        Status: b.paymentStatus,
      })),
      "billing-report"
    );
  };

  const weeklyData = [
    { c: "Mon", v: 8200 }, { c: "Tue", v: 11400 }, { c: "Wed", v: 9800 },
    { c: "Thu", v: 13600 }, { c: "Fri", v: 15200 }, { c: "Sat", v: 9300 }, { c: "Sun", v: 6100 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Payments"
        description="Invoices, insurance claims & revenue tracking."
        actions={
          <>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent focus:outline-none">
              <option value="">All Statuses</option>
              {["PAID","PENDING","OVERDUE","REFUNDED"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
              <Plus className="h-4 w-4" /> New Invoice
            </button>
          </>
        }
      />

      {/* ── Add Invoice Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-bold mb-4">New Invoice</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient</label>
                <select value={form.patientId} onChange={(e) => setForm((p) => ({ ...p, patientId: +e.target.value }))} required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select patient…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId})</option>)}
                </select>
              </div>

              {/* Line items */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Items</label>
                <div className="mt-2 space-y-2">
                  {form.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <span className="flex-1 truncate">{it.description}</span>
                      <span className="text-muted-foreground">×{it.quantity}</span>
                      <span className="font-medium">₹{(it.quantity * it.unitPrice).toLocaleString()}</span>
                      <button type="button" onClick={() => removeItem(idx)} className="text-destructive hover:opacity-70">✕</button>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Description" value={itemLine.description}
                      onChange={(e) => setItemLine((p) => ({ ...p, description: e.target.value }))}
                      className="col-span-3 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
                    <input type="number" placeholder="Qty" value={itemLine.quantity}
                      onChange={(e) => setItemLine((p) => ({ ...p, quantity: +e.target.value }))} min={1}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
                    <input type="number" placeholder="Unit price ₹" value={itemLine.unitPrice}
                      onChange={(e) => setItemLine((p) => ({ ...p, unitPrice: +e.target.value }))} min={0}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
                    <button type="button" onClick={addItem}
                      className="rounded-lg border border-border bg-card py-2 text-xs font-semibold hover:bg-accent">+ Add</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[{ l: "Discount (₹)", k: "discount" }, { l: "Tax (₹)", k: "tax" }].map((f) => (
                  <div key={f.k} className="col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.l}</label>
                    <input type="number" value={(form as any)[f.k]} min={0}
                      onChange={(e) => setForm((p) => ({ ...p, [f.k]: +e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</label>
                  <div className="mt-1 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-bold text-primary">
                    ₹{calcTotal().toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value as any }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                    {["CASH","CARD","UPI","INSURANCE","BANK_TRANSFER"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                  <select value={form.paymentStatus} onChange={(e) => setForm((p) => ({ ...p, paymentStatus: e.target.value as any }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                    {["PENDING","PAID","OVERDUE"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" disabled={createBill.isPending}
                  className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                  {createBill.isPending ? "Saving…" : "Create Invoice"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Revenue (MTD)", v: `₹${((summary?.revenueThisMonth ?? 0) / 1000).toFixed(1)}k` },
          { l: "Outstanding", v: `₹${((summary?.outstanding ?? 0) / 1000).toFixed(1)}k` },
          { l: "Pending Bills", v: String(summary?.pendingCount ?? 0) },
          { l: "Total Invoices", v: String(data?.meta?.total ?? 0) },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className="mt-1 font-display text-2xl font-bold">{s.v}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Invoices Table ── */}
        <Card className="lg:col-span-2">
          <CardHeader title="Invoices" description="All payment records"
            actions={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                    className="w-40 rounded-lg border border-input bg-background py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <button onClick={handleExportCSV} title="Export CSV"
                  className="rounded-lg border border-border p-1.5 hover:bg-accent"><Download className="h-4 w-4" /></button>
              </div>
            }
          />
          <CardBody className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>{["Invoice","Patient","Method","Date","Amount","Status","Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bills.map((inv) => (
                    <tr key={inv.id} className="hover:bg-accent/30">
                      <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 font-medium">{inv.patient?.firstName} {inv.patient?.lastName}</td>
                      <td className="px-4 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-xs">{inv.paymentMethod}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right font-semibold">₹{Number(inv.totalAmount).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusTone[inv.paymentStatus]}`}>{inv.paymentStatus}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* PDF download per row */}
                          <button onClick={() => handleDownloadPDF(inv)} title="Download PDF"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-primary">
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          {inv.paymentStatus === "PENDING" && (
                            <button onClick={() => updateBill.mutate({ id: inv.id, paymentStatus: "PAID" })}
                              className="text-xs font-semibold text-success hover:underline">Paid</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No invoices found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        {/* ── Weekly Chart ── */}
        <Card>
          <CardHeader title="Weekly Collections" />
          <CardBody className="h-[340px]">
            <ResponsiveContainer>
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" /><stop offset="100%" stopColor="var(--color-chart-2)" />
                </linearGradient></defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="c" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="v" fill="url(#bg)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
