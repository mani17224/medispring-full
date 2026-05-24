import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Pill, Plus, Search, Download, X, AlertTriangle, Filter, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { exportToCSV } from "@/lib/pdf";

export const Route = createFileRoute("/pharmacy")({ component: Pharmacy });

// ── Types ────────────────────────────────────────────────────────────────────
interface Medicine {
  id: number;
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  price: number;
  supplier: string;
  expiryDate: string;
  batchNo: string;
}

interface Dispensation {
  id: number;
  medicineId: number;
  medicineName: string;
  patientName: string;
  patientId: string;
  doctor: string;
  quantity: number;
  date: string;
  status: "Dispensed" | "Pending" | "Returned";
}

// ── Seed data (local state until pharmacy API is added) ───────────────────────
const seedMedicines: Medicine[] = [
  { id: 1, name: "Metformin 500mg", category: "Diabetes", stock: 450, unit: "Tablets", reorderLevel: 100, price: 2.5, supplier: "Sun Pharma", expiryDate: "2027-06-30", batchNo: "MF2024A" },
  { id: 2, name: "Amlodipine 5mg", category: "Cardiac", stock: 38, unit: "Tablets", reorderLevel: 50, price: 4.2, supplier: "Cipla", expiryDate: "2026-12-31", batchNo: "AM2024B" },
  { id: 3, name: "Insulin Glargine", category: "Diabetes", stock: 12, unit: "Vials", reorderLevel: 20, price: 580, supplier: "Sanofi", expiryDate: "2026-08-15", batchNo: "IG2024C" },
  { id: 4, name: "Atorvastatin 20mg", category: "Cardiac", stock: 200, unit: "Tablets", reorderLevel: 60, price: 3.8, supplier: "Ranbaxy", expiryDate: "2027-03-31", batchNo: "AT2024D" },
  { id: 5, name: "Paracetamol 500mg", category: "Analgesic", stock: 1200, unit: "Tablets", reorderLevel: 200, price: 0.8, supplier: "GSK", expiryDate: "2027-09-30", batchNo: "PC2024E" },
  { id: 6, name: "Amoxicillin 250mg", category: "Antibiotic", stock: 45, unit: "Capsules", reorderLevel: 80, price: 5.5, supplier: "Pfizer", expiryDate: "2026-11-30", batchNo: "AX2024F" },
  { id: 7, name: "Pantoprazole 40mg", category: "Gastric", stock: 320, unit: "Tablets", reorderLevel: 70, price: 3.2, supplier: "Sun Pharma", expiryDate: "2027-04-30", batchNo: "PP2024G" },
  { id: 8, name: "Ceftriaxone 1g Inj.", category: "Antibiotic", stock: 24, unit: "Vials", reorderLevel: 30, price: 85, supplier: "Cipla", expiryDate: "2026-07-31", batchNo: "CF2024H" },
  { id: 9, name: "Furosemide 40mg", category: "Diuretic", stock: 150, unit: "Tablets", reorderLevel: 50, price: 2.1, supplier: "Torrent", expiryDate: "2027-01-31", batchNo: "FR2024I" },
  { id: 10, name: "Morphine Sulphate", category: "Analgesic", stock: 8, unit: "Ampoules", reorderLevel: 15, price: 420, supplier: "Neon Labs", expiryDate: "2026-09-30", batchNo: "MS2024J" },
  { id: 11, name: "Salbutamol Inhaler", category: "Respiratory", stock: 55, unit: "Inhalers", reorderLevel: 20, price: 145, supplier: "GSK", expiryDate: "2027-02-28", batchNo: "SB2024K" },
  { id: 12, name: "Heparin 5000 IU", category: "Anticoagulant", stock: 30, unit: "Vials", reorderLevel: 20, price: 195, supplier: "Pfizer", expiryDate: "2026-10-31", batchNo: "HP2024L" },
];

const seedDispensations: Dispensation[] = [
  { id: 1, medicineId: 1, medicineName: "Metformin 500mg", patientName: "Aarav Mehta", patientId: "PT-1035", doctor: "Dr. Anjali Verma", quantity: 30, date: "2026-05-22", status: "Dispensed" },
  { id: 2, medicineId: 3, medicineName: "Insulin Glargine", patientName: "Priya Nair", patientId: "PT-1038", doctor: "Dr. Rajesh Rao", quantity: 2, date: "2026-05-22", status: "Dispensed" },
  { id: 3, medicineId: 6, medicineName: "Amoxicillin 250mg", patientName: "Rahul Singh", patientId: "PT-1037", doctor: "Dr. Priyanka Bose", quantity: 21, date: "2026-05-21", status: "Pending" },
  { id: 4, medicineId: 5, medicineName: "Paracetamol 500mg", patientName: "Meera Joshi", patientId: "PT-1042", doctor: "Dr. Sameer Kapoor", quantity: 10, date: "2026-05-21", status: "Dispensed" },
  { id: 5, medicineId: 2, medicineName: "Amlodipine 5mg", patientName: "Kabir Khan", patientId: "PT-1041", doctor: "Dr. Anjali Verma", quantity: 30, date: "2026-05-20", status: "Pending" },
];

const categories = ["All", "Antibiotic", "Analgesic", "Cardiac", "Diabetes", "Respiratory", "Gastric", "Anticoagulant", "Diuretic"];
const statusTone: Record<string, string> = {
  Dispensed: "bg-success/10 text-success",
  Pending: "bg-warning/15 text-warning",
  Returned: "bg-muted text-muted-foreground",
};

function Pharmacy() {
  const [medicines, setMedicines] = useState<Medicine[]>(seedMedicines);
  const [dispensations, setDispensations] = useState<Dispensation[]>(seedDispensations);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "dispense">("inventory");
  const [showAddMed, setShowAddMed] = useState(false);
  const [showDispense, setShowDispense] = useState(false);

  const [medForm, setMedForm] = useState<Partial<Medicine>>({ name: "", category: "Analgesic", stock: 0, unit: "Tablets", reorderLevel: 50, price: 0, supplier: "", expiryDate: "", batchNo: "" });
  const [dispForm, setDispForm] = useState({ medicineId: 0, patientName: "", patientId: "", doctor: "", quantity: 1 });

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    medicines.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.supplier.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "All" || m.category === catFilter;
      const matchLow = !lowStockOnly || m.stock <= m.reorderLevel;
      return matchSearch && matchCat && matchLow;
    }), [medicines, search, catFilter, lowStockOnly]);

  const lowStockCount = medicines.filter((m) => m.stock <= m.reorderLevel).length;
  const totalValue = medicines.reduce((s, m) => s + m.stock * m.price, 0);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: Medicine = { ...medForm as Medicine, id: Date.now() };
    setMedicines((prev) => [newMed, ...prev]);
    setShowAddMed(false);
    setMedForm({ name: "", category: "Analgesic", stock: 0, unit: "Tablets", reorderLevel: 50, price: 0, supplier: "", expiryDate: "", batchNo: "" });
  };

  const handleDispense = (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === dispForm.medicineId);
    if (!med) return;
    if (dispForm.quantity > med.stock) { alert("Insufficient stock!"); return; }
    // Deduct stock
    setMedicines((prev) => prev.map((m) => m.id === dispForm.medicineId ? { ...m, stock: m.stock - dispForm.quantity } : m));
    // Add dispensation record
    setDispensations((prev) => [{
      id: Date.now(), medicineId: dispForm.medicineId, medicineName: med.name,
      patientName: dispForm.patientName, patientId: dispForm.patientId,
      doctor: dispForm.doctor, quantity: dispForm.quantity,
      date: new Date().toISOString().split("T")[0], status: "Dispensed",
    }, ...prev]);
    setShowDispense(false);
    setDispForm({ medicineId: 0, patientName: "", patientId: "", doctor: "", quantity: 1 });
  };

  const handleDeleteMed = (id: number) => {
    if (!confirm("Remove this medicine?")) return;
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const handleExportInventory = () => {
    exportToCSV(filtered.map((m) => ({
      Name: m.name, Category: m.category, Stock: m.stock, Unit: m.unit,
      ReorderLevel: m.reorderLevel, Price: m.price, Supplier: m.supplier,
      Expiry: m.expiryDate, Batch: m.batchNo,
      Status: m.stock <= m.reorderLevel ? "LOW STOCK" : "OK",
    })), "pharmacy-inventory");
  };

  const handleExportDispensations = () => {
    exportToCSV(dispensations.map((d) => ({
      Medicine: d.medicineName, Patient: d.patientName, PatientID: d.patientId,
      Doctor: d.doctor, Quantity: d.quantity, Date: d.date, Status: d.status,
    })), "dispensation-records");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy"
        description="Drug inventory, dispensation records and stock alerts."
        actions={
          <>
            <button onClick={activeTab === "inventory" ? handleExportInventory : handleExportDispensations}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            {activeTab === "inventory" ? (
              <button onClick={() => setShowAddMed(true)}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
                <Plus className="h-4 w-4" /> Add Medicine
              </button>
            ) : (
              <button onClick={() => setShowDispense(true)}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">
                <Pill className="h-4 w-4" /> Dispense Medicine
              </button>
            )}
          </>
        }
      />

      {/* ── Add Medicine Modal ── */}
      {showAddMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Add Medicine to Inventory</h3>
              <button onClick={() => setShowAddMed(false)} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddMed} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medicine Name</label>
                  <input value={medForm.name} onChange={(e) => setMedForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Metformin 500mg"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select value={medForm.category} onChange={(e) => setMedForm((p) => ({ ...p, category: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                    {categories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit</label>
                  <select value={medForm.unit} onChange={(e) => setMedForm((p) => ({ ...p, unit: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                    {["Tablets","Capsules","Vials","Ampoules","Inhalers","Syrup","Drops","Cream"].map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock Qty</label>
                  <input type="number" value={medForm.stock} min={0} onChange={(e) => setMedForm((p) => ({ ...p, stock: +e.target.value }))} required
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reorder Level</label>
                  <input type="number" value={medForm.reorderLevel} min={0} onChange={(e) => setMedForm((p) => ({ ...p, reorderLevel: +e.target.value }))} required
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price per Unit (₹)</label>
                  <input type="number" value={medForm.price} min={0} step={0.01} onChange={(e) => setMedForm((p) => ({ ...p, price: +e.target.value }))} required
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry Date</label>
                  <input type="date" value={medForm.expiryDate} onChange={(e) => setMedForm((p) => ({ ...p, expiryDate: e.target.value }))} required
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Batch Number</label>
                  <input value={medForm.batchNo} onChange={(e) => setMedForm((p) => ({ ...p, batchNo: e.target.value }))} placeholder="e.g. MF2024A"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</label>
                  <input value={medForm.supplier} onChange={(e) => setMedForm((p) => ({ ...p, supplier: e.target.value }))} placeholder="e.g. Sun Pharma"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMed(false)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow">Add Medicine</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Dispense Medicine Modal ── */}
      {showDispense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Dispense Medicine</h3>
              <button onClick={() => setShowDispense(false)} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleDispense} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medicine</label>
                <select value={dispForm.medicineId} onChange={(e) => setDispForm((p) => ({ ...p, medicineId: +e.target.value }))} required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value={0}>Select medicine…</option>
                  {medicines.filter((m) => m.stock > 0).map((m) => (
                    <option key={m.id} value={m.id}>{m.name} — {m.stock} {m.unit} available</option>
                  ))}
                </select>
                {dispForm.medicineId > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Stock: <strong>{medicines.find((m) => m.id === dispForm.medicineId)?.stock}</strong> {medicines.find((m) => m.id === dispForm.medicineId)?.unit}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient Name</label>
                  <input value={dispForm.patientName} onChange={(e) => setDispForm((p) => ({ ...p, patientName: e.target.value }))} required placeholder="Full name"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient ID</label>
                  <input value={dispForm.patientId} onChange={(e) => setDispForm((p) => ({ ...p, patientId: e.target.value }))} placeholder="PT-XXXX"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ordering Doctor</label>
                  <input value={dispForm.doctor} onChange={(e) => setDispForm((p) => ({ ...p, doctor: e.target.value }))} placeholder="Dr. Name"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</label>
                  <input type="number" value={dispForm.quantity} min={1} onChange={(e) => setDispForm((p) => ({ ...p, quantity: +e.target.value }))} required
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDispense(false)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow">Dispense</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Total Medicines", v: medicines.length, c: "text-foreground" },
          { l: "Low Stock Alert", v: lowStockCount, c: "text-destructive" },
          { l: "Total Stock Value", v: `₹${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, c: "text-success" },
          { l: "Dispensations Today", v: dispensations.filter((d) => d.date === new Date().toISOString().split("T")[0]).length, c: "text-primary" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between mb-1">
              {s.l === "Low Stock Alert" && lowStockCount > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className={`font-display text-2xl font-bold ${s.c}`}>{s.v}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Low stock banner ── */}
      {lowStockCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/8 px-5 py-3.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1 text-sm">
            <strong>{lowStockCount} medicines</strong> are at or below reorder level.
            <button onClick={() => setLowStockOnly(true)} className="ml-2 font-semibold text-destructive underline underline-offset-2">View all →</button>
          </div>
          {lowStockOnly && <button onClick={() => setLowStockOnly(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground">Show all</button>}
        </motion.div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-border">
        {(["inventory", "dispense"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab === "inventory" ? "Drug Inventory" : "Dispensation Records"}
          </button>
        ))}
      </div>

      {activeTab === "inventory" && (
        <Card>
          <CardHeader title="Drug Inventory" description={`${filtered.length} medicines listed`}
            actions={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicine…"
                    className="w-44 rounded-lg border border-input bg-background py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
                <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                  className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs focus:outline-none">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
                <button onClick={() => setLowStockOnly((v) => !v)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${lowStockOnly ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border hover:bg-accent"}`}>
                  <Filter className="inline h-3 w-3 mr-1" />Low Stock
                </button>
              </div>
            }
          />
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["Medicine","Category","Stock","Reorder","Price","Expiry","Supplier","Status","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => {
                  const isLow = m.stock <= m.reorderLevel;
                  return (
                    <tr key={m.id} className={`hover:bg-accent/30 ${isLow ? "bg-destructive/5" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.batchNo}</div>
                      </td>
                      <td className="px-4 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-xs">{m.category}</span></td>
                      <td className={`px-4 py-3 font-bold ${isLow ? "text-destructive" : "text-foreground"}`}>
                        {m.stock} <span className="font-normal text-muted-foreground text-xs">{m.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.reorderLevel}</td>
                      <td className="px-4 py-3">₹{m.price}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.expiryDate}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.supplier}</td>
                      <td className="px-4 py-3">
                        {isLow
                          ? <span className="rounded-full bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive">Low Stock</span>
                          : <span className="rounded-full bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">In Stock</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteMed(m.id)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No medicines found</td></tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {activeTab === "dispense" && (
        <Card>
          <CardHeader title="Dispensation Records" description={`${dispensations.length} records`} />
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["Medicine","Patient","Patient ID","Doctor","Qty","Date","Status"].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dispensations.map((d) => (
                  <tr key={d.id} className="hover:bg-accent/30">
                    <td className="px-5 py-3 font-semibold">{d.medicineName}</td>
                    <td className="px-5 py-3">{d.patientName}</td>
                    <td className="px-5 py-3 font-mono text-xs">{d.patientId}</td>
                    <td className="px-5 py-3 text-muted-foreground">{d.doctor}</td>
                    <td className="px-5 py-3 font-bold">{d.quantity}</td>
                    <td className="px-5 py-3 text-muted-foreground">{d.date}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusTone[d.status]}`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
                {dispensations.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No dispensation records</td></tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
