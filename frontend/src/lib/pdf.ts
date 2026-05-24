// src/lib/pdf.ts
// Client-side PDF & CSV generation utilities (no server needed)

// ─── Types ────────────────────────────────────────────────────────────────────
interface InvoiceData {
  invoiceNumber: string;
  patientName: string;
  patientId: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  items?: { description: string; quantity: number; unitPrice: number }[];
  amount: number;
  discount: number;
  tax: number;
  totalAmount: number;
}

// ─── HTML → PDF via browser print ────────────────────────────────────────────
function printHTML(html: string, title = "MediSpring") {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Pop-up blocked — please allow pop-ups for this site."); return; }
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
      .brand { font-size: 26px; font-weight: 800; color: #4f46e5; }
      .brand span { font-size: 11px; font-weight: 400; color: #6b7280; display: block; margin-top: 2px; letter-spacing: .05em; text-transform: uppercase; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
      .badge-paid { background: #d1fae5; color: #065f46; }
      .badge-pending { background: #fef3c7; color: #92400e; }
      .badge-overdue { background: #fee2e2; color: #991b1b; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #f3f4f6; text-align: left; padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
      td { padding: 12px 14px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
      .totals { margin-left: auto; width: 280px; }
      .totals td { border: none; padding: 6px 14px; }
      .totals .grand { font-size: 17px; font-weight: 700; color: #4f46e5; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
      .info-block label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #9ca3af; display: block; margin-bottom: 3px; }
      .info-block span { font-size: 14px; font-weight: 500; }
      @media print { button { display: none; } }
    </style>
  </head><body>${html}
  <div class="footer">MediSpring Hospital Suite · Generated ${new Date().toLocaleString()} · Confidential</div>
  <script>window.onload = () => { window.print(); }<\/script>
  </body></html>`);
  win.document.close();
}

// ─── Invoice PDF ──────────────────────────────────────────────────────────────
export function downloadInvoicePDF(inv: InvoiceData) {
  const statusClass = inv.paymentStatus === "PAID" ? "badge-paid" : inv.paymentStatus === "OVERDUE" ? "badge-overdue" : "badge-pending";
  const rows = (inv.items && inv.items.length > 0)
    ? inv.items.map((it) => `<tr><td>${it.description}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">₹${it.unitPrice.toLocaleString()}</td><td style="text-align:right">₹${(it.quantity * it.unitPrice).toLocaleString()}</td></tr>`).join("")
    : `<tr><td>Medical Services</td><td style="text-align:center">1</td><td style="text-align:right">₹${Number(inv.amount).toLocaleString()}</td><td style="text-align:right">₹${Number(inv.amount).toLocaleString()}</td></tr>`;

  const html = `
    <div class="header">
      <div><div class="brand">MediSpring <span>Hospital Management Suite</span></div></div>
      <div style="text-align:right">
        <div style="font-size:20px;font-weight:700;color:#374151">INVOICE</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px">${inv.invoiceNumber}</div>
        <span class="badge ${statusClass}" style="margin-top:8px">${inv.paymentStatus}</span>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-block"><label>Billed To</label><span>${inv.patientName}</span><span style="font-size:12px;color:#6b7280">${inv.patientId}</span></div>
      <div class="info-block"><label>Invoice Date</label><span>${new Date(inv.createdAt).toLocaleDateString("en-IN", { year:"numeric",month:"long",day:"numeric"})}</span></div>
      <div class="info-block"><label>Payment Method</label><span>${inv.paymentMethod}</span></div>
      <div class="info-block"><label>Invoice Number</label><span>${inv.invoiceNumber}</span></div>
    </div>
    <table>
      <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal</td><td style="text-align:right">₹${Number(inv.amount).toLocaleString()}</td></tr>
      <tr><td style="color:#059669">Discount</td><td style="text-align:right;color:#059669">−₹${Number(inv.discount || 0).toLocaleString()}</td></tr>
      <tr><td>Tax</td><td style="text-align:right">₹${Number(inv.tax || 0).toLocaleString()}</td></tr>
      <tr class="grand"><td><strong>Total</strong></td><td style="text-align:right"><strong>₹${Number(inv.totalAmount).toLocaleString()}</strong></td></tr>
    </table>`;

  printHTML(html, `Invoice ${inv.invoiceNumber}`);
}

// ─── CSV export ───────────────────────────────────────────────────────────────
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [
    keys.join(","),
    ...data.map((row) =>
      keys.map((k) => {
        const val = row[k] ?? "";
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(",")
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── Lab report PDF ───────────────────────────────────────────────────────────
export function downloadLabReportPDF(test: {
  testName: string; testCategory?: string; testResult?: string;
  normalRange?: string; isCritical: boolean; status: string;
  completedAt?: string; notes?: string;
  patient?: { firstName: string; lastName: string; patientId: string };
  doctor?: { name: string };
}) {
  const criticalBadge = test.isCritical
    ? `<span class="badge" style="background:#fee2e2;color:#991b1b;margin-left:8px">⚠ CRITICAL</span>` : "";

  const html = `
    <div class="header">
      <div><div class="brand">MediSpring <span>Laboratory Report</span></div></div>
      <div style="text-align:right">
        <div style="font-size:16px;font-weight:700">${test.testName}${criticalBadge}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px">${test.testCategory ?? "General"}</div>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-block"><label>Patient</label><span>${test.patient?.firstName ?? ""} ${test.patient?.lastName ?? ""}</span><span style="font-size:12px;color:#6b7280">${test.patient?.patientId ?? ""}</span></div>
      <div class="info-block"><label>Ordering Doctor</label><span>${test.doctor?.name ?? "—"}</span></div>
      <div class="info-block"><label>Status</label><span>${test.status}</span></div>
      <div class="info-block"><label>Completed</label><span>${test.completedAt ? new Date(test.completedAt).toLocaleDateString("en-IN", { year:"numeric",month:"long",day:"numeric"}) : "Pending"}</span></div>
    </div>
    <table>
      <thead><tr><th>Test</th><th>Result</th><th>Normal Range</th><th>Interpretation</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>${test.testName}</strong></td>
          <td style="font-size:16px;font-weight:700;color:${test.isCritical ? "#dc2626" : "#059669"}">${test.testResult ?? "Pending"}</td>
          <td>${test.normalRange ?? "—"}</td>
          <td><span class="badge ${test.isCritical ? "badge-overdue" : "badge-paid"}">${test.isCritical ? "Abnormal" : "Normal"}</span></td>
        </tr>
      </tbody>
    </table>
    ${test.notes ? `<div style="margin-top:20px;padding:14px;background:#f9fafb;border-radius:8px;border-left:4px solid #4f46e5"><strong style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">Clinical Notes</strong><p style="margin-top:6px;font-size:14px">${test.notes}</p></div>` : ""}`;

  printHTML(html, `Lab Report — ${test.testName}`);
}

// ─── Dashboard export ─────────────────────────────────────────────────────────
export function exportDashboardReport(stats: any) {
  const html = `
    <div class="header">
      <div><div class="brand">MediSpring <span>Dashboard Report</span></div></div>
      <div style="text-align:right;font-size:13px;color:#6b7280">
        Generated: ${new Date().toLocaleDateString("en-IN", { year:"numeric",month:"long",day:"numeric"})}
      </div>
    </div>
    <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">Hospital Performance Summary</h2>
    <table>
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Total Patients</td><td><strong>${stats?.patients?.total ?? 0}</strong></td></tr>
        <tr><td>High Risk Patients</td><td><strong>${stats?.patients?.highRisk ?? 0}</strong></td></tr>
        <tr><td>Total Doctors</td><td><strong>${stats?.doctors?.total ?? 0}</strong></td></tr>
        <tr><td>Available Doctors</td><td><strong>${stats?.doctors?.available ?? 0}</strong></td></tr>
        <tr><td>Today's Appointments</td><td><strong>${stats?.appointments?.today ?? 0}</strong></td></tr>
        <tr><td>Total Beds</td><td><strong>${stats?.beds?.total ?? 0}</strong></td></tr>
        <tr><td>Occupied Beds</td><td><strong>${stats?.beds?.occupied ?? 0}</strong></td></tr>
        <tr><td>Available Beds</td><td><strong>${stats?.beds?.available ?? 0}</strong></td></tr>
        <tr><td>ICU Occupied</td><td><strong>${stats?.beds?.icu ?? 0}</strong></td></tr>
        <tr><td>Monthly Revenue</td><td><strong>₹${Number(stats?.revenue?.monthly ?? 0).toLocaleString()}</strong></td></tr>
        <tr><td>Outstanding Bills</td><td><strong>₹${Number(stats?.revenue?.outstanding ?? 0).toLocaleString()}</strong></td></tr>
      </tbody>
    </table>`;
  printHTML(html, "MediSpring Dashboard Report");
}
