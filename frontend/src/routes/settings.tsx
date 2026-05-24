import { createFileRoute } from "@tanstack/react-router";
import { Bell, Building2, Check, Lock, Palette, Plus, Shield, Trash2, Users, X, Loader2, Eye, EyeOff, UserCheck } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, usePendingUsers, useActivateUser } from "@/hooks/useApi";
import api from "@/lib/api";

export const Route = createFileRoute("/settings")({ component: Settings });

const tabs = [
  { id: "hospital",     icon: Building2, label: "Hospital Profile" },
  { id: "users",        icon: Users,     label: "User Management" },
  { id: "theme",        icon: Palette,   label: "Theme & Display" },
  { id: "notifications",icon: Bell,      label: "Notifications" },
  { id: "security",     icon: Lock,      label: "Security" },
  { id: "roles",        icon: Shield,    label: "Role Permissions" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", DOCTOR: "Doctor", RECEPTIONIST: "Receptionist",
  LABORATORY_STAFF: "Lab Staff", PHARMACIST: "Pharmacist", PATIENT: "Patient",
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-destructive/10 text-destructive", DOCTOR: "bg-primary/10 text-primary",
  RECEPTIONIST: "bg-info/10 text-info", LABORATORY_STAFF: "bg-warning/15 text-warning",
  PHARMACIST: "bg-success/10 text-success", PATIENT: "bg-muted text-muted-foreground",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN:            ["Full system access", "User management", "All modules", "Settings & configuration", "Reports & analytics", "Delete records"],
  DOCTOR:           ["View all patients", "Create appointments", "Order lab tests", "View lab results", "Access EMR", "Billing view"],
  RECEPTIONIST:     ["Register patients", "Book appointments", "Create invoices", "View schedules", "Bed allocation"],
  LABORATORY_STAFF: ["View lab orders", "Enter test results", "Upload reports", "Mark critical results"],
  PHARMACIST:       ["View prescriptions", "Manage drug inventory", "Dispense medicines", "View patients"],
  PATIENT:          ["View own records", "View own appointments", "View own invoices"],
};

function Settings() {
  const [active, setActive] = useState("hospital");
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  // Hospital profile state
  const [hospitalProfile, setHospitalProfile] = useState({
    name: "MediSpring Multispecialty", regId: "MH-2024-00187",
    email: "admin@medispring.com", phone: "+91 22 1234 5678",
    address: "Plot 14, Andheri East, Mumbai", timezone: "Asia/Kolkata",
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // User management
  const { data: usersData, isLoading: usersLoading } = useUsers({ limit: 50 });
  const { data: pendingData } = usePendingUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const activateUser = useActivateUser();
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "", role: "DOCTOR" });

  // Security
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Notifications prefs
  const [notifPrefs, setNotifPrefs] = useState({
    appointments: true, billing: true, labResults: true,
    emergencies: true, systemAlerts: false, emailDigest: false,
  });

  const users = usersData?.data ?? [];
  const pendingUsers = pendingData?.data ?? [];

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser.mutateAsync(userForm as any);
    setShowAddUser(false);
    setUserForm({ firstName: "", lastName: "", email: "", password: "", phone: "", role: "DOCTOR" });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: "error", text: "New passwords do not match" }); return; }
    if (pwForm.next.length < 8) { setPwMsg({ type: "error", text: "Password must be at least 8 characters" }); return; }
    try {
      await api.put(`/users/${user?.id}`, { password: pwForm.next });
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch {
      setPwMsg({ type: "error", text: "Failed to change password" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your hospital workspace." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        {/* ── Sidebar tabs ── */}
        <Card>
          <CardBody className="p-2">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active === t.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
                <t.icon className="h-4 w-4 shrink-0" /> {t.label}
                {t.id === "users" && pendingUsers.length > 0 && (
                  <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">{pendingUsers.length}</span>
                )}
              </button>
            ))}
          </CardBody>
        </Card>

        {/* ── Panel ── */}
        <div className="space-y-4 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

              {/* ── Hospital Profile ── */}
              {active === "hospital" && (
                <Card>
                  <CardHeader title="Hospital Profile" description="Public information shown across the suite" />
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        { l: "Hospital Name", k: "name" }, { l: "Registration ID", k: "regId" },
                        { l: "Contact Email", k: "email" }, { l: "Phone", k: "phone" },
                        { l: "Address", k: "address" }, { l: "Timezone", k: "timezone" },
                      ].map((f) => (
                        <div key={f.k}>
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.l}</label>
                          <input value={(hospitalProfile as any)[f.k]}
                            onChange={(e) => setHospitalProfile((p) => ({ ...p, [f.k]: e.target.value }))}
                            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handleSaveProfile}
                        className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glow">
                        {profileSaved ? <><Check className="h-4 w-4" /> Saved!</> : "Save changes"}
                      </button>
                      {profileSaved && <span className="text-sm text-success">✓ Hospital profile updated</span>}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* ── User Management ── */}
              {active === "users" && (
                <div className="space-y-4">
                  {/* Pending accounts */}
                  {pendingUsers.length > 0 && (
                    <Card>
                      <CardHeader title="Pending Account Requests" description={`${pendingUsers.length} waiting for approval`} />
                      <CardBody className="p-0">
                        <div className="divide-y divide-border">
                          {pendingUsers.map((u) => (
                            <div key={u.id} className="flex items-center gap-4 px-5 py-3">
                              <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-semibold">
                                {u.firstName[0]}{u.lastName[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold">{u.firstName} {u.lastName}</div>
                                <div className="text-xs text-muted-foreground">{u.email} · {ROLE_LABELS[u.role] ?? u.role}</div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => activateUser.mutate(u.id)} disabled={activateUser.isPending}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20 disabled:opacity-60">
                                  <UserCheck className="h-3.5 w-3.5" /> Approve
                                </button>
                                <button onClick={() => deleteUser.mutate(u.id)}
                                  className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20">
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* Add user modal */}
                  {showAddUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-elevated">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-display text-lg font-bold">Add New User</h3>
                          <button onClick={() => setShowAddUser(false)} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {[{ l: "First Name", k: "firstName" }, { l: "Last Name", k: "lastName" }].map((f) => (
                              <div key={f.k}>
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.l}</label>
                                <input value={(userForm as any)[f.k]} onChange={(e) => setUserForm((p) => ({ ...p, [f.k]: e.target.value }))} required
                                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                              </div>
                            ))}
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                            <input type="email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} required
                              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</label>
                            <input value={userForm.phone} onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))}
                              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</label>
                            <select value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                            <div className="relative">
                              <input type={showPw ? "text" : "password"} value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} required minLength={8}
                                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 text-muted-foreground">
                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-1">
                            <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-accent">Cancel</button>
                            <button type="submit" disabled={createUser.isPending}
                              className="flex-1 rounded-xl gradient-primary py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                              {createUser.isPending ? "Creating…" : "Create User"}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}

                  <Card>
                    <CardHeader title="All Users" description={`${users.length} accounts`}
                      actions={
                        <button onClick={() => setShowAddUser(true)}
                          className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3 py-2 text-sm font-semibold text-white shadow-glow">
                          <Plus className="h-4 w-4" /> Add User
                        </button>
                      }
                    />
                    <CardBody className="p-0">
                      {usersLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>{["User","Email","Role","Status","Actions"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {users.map((u) => (
                              <tr key={u.id} className="hover:bg-accent/30">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="grid h-8 w-8 place-items-center rounded-full gradient-primary text-xs font-bold text-white">
                                      {u.firstName[0]}{u.lastName[0]}
                                    </div>
                                    <span className="font-medium">{u.firstName} {u.lastName}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                                <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[u.role] ?? "bg-muted text-muted-foreground"}`}>{ROLE_LABELS[u.role] ?? u.role}</span></td>
                                <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                                <td className="px-5 py-3">
                                  <div className="flex gap-2">
                                    {!u.isActive && (
                                      <button onClick={() => activateUser.mutate(u.id)}
                                        className="text-xs font-semibold text-success hover:underline">Activate</button>
                                    )}
                                    {u.id !== user?.id && (
                                      <button onClick={() => { if (confirm("Deactivate this user?")) deleteUser.mutate(u.id); }}
                                        className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No users found</td></tr>}
                          </tbody>
                        </table>
                      )}
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* ── Theme & Display ── */}
              {active === "theme" && (
                <Card>
                  <CardHeader title="Theme & Display" description="Customize your visual experience" />
                  <CardBody className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-border p-4">
                      <div>
                        <div className="font-semibold">Dark mode</div>
                        <div className="text-sm text-muted-foreground">Currently: <strong>{theme}</strong></div>
                      </div>
                      <button onClick={toggle}
                        className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-primary" : "bg-muted"}`}>
                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${theme === "dark" ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <div className="font-semibold">Interface density</div>
                      <div className="mt-3 flex gap-2">
                        {["Comfortable","Compact","Cosy"].map((d, i) => (
                          <button key={d} className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>{d}</button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <div className="font-semibold">Brand accent color</div>
                      <div className="mt-3 flex gap-3">
                        {["bg-violet-600","bg-blue-600","bg-emerald-600","bg-rose-600","bg-amber-600"].map((c) => (
                          <button key={c} className={`h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-background ring-transparent hover:ring-foreground/30 ${c}`} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border p-4">
                      <div>
                        <div className="font-semibold">Reduce animations</div>
                        <div className="text-sm text-muted-foreground">Better for accessibility and low-end devices</div>
                      </div>
                      <button className="relative h-7 w-12 rounded-full bg-muted">
                        <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* ── Notifications ── */}
              {active === "notifications" && (
                <Card>
                  <CardHeader title="Notification Preferences" description="Choose what alerts you receive" />
                  <CardBody className="space-y-3">
                    {[
                      { k: "appointments", l: "Appointment reminders", d: "Get notified before upcoming appointments" },
                      { k: "billing", l: "Billing alerts", d: "Payment due and overdue notifications" },
                      { k: "labResults", l: "Lab results ready", d: "When patient test results are available" },
                      { k: "emergencies", l: "Emergency alerts", d: "Critical patient and code blue alerts" },
                      { k: "systemAlerts", l: "System alerts", d: "Maintenance, updates and downtime notices" },
                      { k: "emailDigest", l: "Daily email digest", d: "Summary of hospital activity every morning" },
                    ].map((pref) => (
                      <div key={pref.k} className="flex items-center justify-between rounded-xl border border-border p-4">
                        <div>
                          <div className="font-medium">{pref.l}</div>
                          <div className="text-xs text-muted-foreground">{pref.d}</div>
                        </div>
                        <button onClick={() => setNotifPrefs((p) => ({ ...p, [pref.k]: !p[pref.k as keyof typeof p] }))}
                          className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${(notifPrefs as any)[pref.k] ? "bg-primary" : "bg-muted"}`}>
                          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${(notifPrefs as any)[pref.k] ? "left-6" : "left-1"}`} />
                        </button>
                      </div>
                    ))}
                    <button className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glow">
                      <Check className="h-4 w-4" /> Save preferences
                    </button>
                  </CardBody>
                </Card>
              )}

              {/* ── Security ── */}
              {active === "security" && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader title="Change Password" description="Use a strong, unique password" />
                    <CardBody className="max-w-md space-y-3">
                      {pwMsg && (
                        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${pwMsg.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {pwMsg.text}
                        </div>
                      )}
                      <form onSubmit={handleChangePassword} className="space-y-3">
                        {[
                          { l: "Current Password", k: "current", show: showCurrentPw, setShow: setShowCurrentPw },
                          { l: "New Password", k: "next", show: showNewPw, setShow: setShowNewPw },
                          { l: "Confirm New Password", k: "confirm", show: showNewPw, setShow: setShowNewPw },
                        ].map((f) => (
                          <div key={f.k}>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.l}</label>
                            <div className="relative">
                              <input type={f.show ? "text" : "password"} value={(pwForm as any)[f.k]}
                                onChange={(e) => setPwForm((p) => ({ ...p, [f.k]: e.target.value }))} required
                                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                              <button type="button" onClick={() => f.setShow((v: boolean) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {f.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        ))}
                        <button type="submit"
                          className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glow">
                          <Lock className="h-4 w-4" /> Update password
                        </button>
                      </form>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader title="Active Sessions" description="Manage where you're signed in" />
                    <CardBody className="space-y-3">
                      {[
                        { device: "Chrome on Windows", loc: "Mumbai, IN", time: "Now (current)", current: true },
                        { device: "Safari on iPhone", loc: "Mumbai, IN", time: "2 hours ago", current: false },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-border p-4">
                          <div>
                            <div className="flex items-center gap-2 font-medium text-sm">
                              {s.device} {s.current && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">Current</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">{s.loc} · {s.time}</div>
                          </div>
                          {!s.current && <button className="text-xs font-semibold text-destructive hover:underline">Revoke</button>}
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* ── Role Permissions ── */}
              {active === "roles" && (
                <Card>
                  <CardHeader title="Role Permissions" description="View permissions assigned to each role. Contact support to modify." />
                  <CardBody className="space-y-4">
                    {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                      <div key={role} className="rounded-xl border border-border p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
                          <span className="text-xs text-muted-foreground">{perms.length} permissions</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm) => (
                            <span key={perm} className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium">
                              <Check className="h-3 w-3 text-success" /> {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
