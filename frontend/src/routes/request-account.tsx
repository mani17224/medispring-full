import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ArrowLeft, ArrowRight, AtSign, Check, ChevronRight,
  Eye, EyeOff, IdCard, KeyRound, Lock, Mail, Phone, ShieldCheck,
  Stethoscope, User, Users, Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRequestAccount } from "@/hooks/useApi";

export const Route = createFileRoute("/request-account")({ component: RequestAccount });

const roles = ["Admin", "Doctor", "Receptionist", "Laboratory_Staff", "Pharmacist", "Patient"];
const departments = [
  "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology",
  "Radiology", "Pathology", "Emergency", "General Medicine", "Administration",
];

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function RequestAccount() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("Doctor");
  const [dept, setDept] = useState("Cardiology");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseId, setLicenseId] = useState("");

  // Step 3 fields
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [agreed, setAgreed] = useState(false);

  const requestAccount = useRequestAccount();

  const pwScore = strength(pw);
  const pwLabel = ["Very weak", "Weak", "Fair", "Good", "Strong"][pwScore];
  const pwColor = ["bg-destructive", "bg-destructive", "bg-warning", "bg-success", "bg-success"][pwScore];
  const pwMatch = pw && confirmPw && pw === confirmPw;
  const pwMismatch = pw && confirmPw && pw !== confirmPw;

  const canNext = useMemo(() => {
    if (step === 1) return firstName.trim() !== "" && email.trim() !== "";
    if (step === 2) return true;
    if (step === 3) return pwScore >= 2 && !!pwMatch && agreed;
    return true;
  }, [step, firstName, email, pwScore, pwMatch, agreed]);

  const steps = ["Personal info", "Role & Department", "Password & Terms"];

  const handleSubmit = async () => {
    setApiError("");
    try {
      await requestAccount.mutateAsync({
        firstName,
        lastName,
        email,
        password: pw,
        phone: phone || undefined,
        role: role.toUpperCase().replace(" ", "_"),
        department: dept,
        licenseId: licenseId || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setApiError(err?.response?.data?.message || "Failed to submit request. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh flex items-center justify-center p-6">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-chart-2/30 blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl glass p-10 shadow-elevated text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-primary shadow-glow">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold">Request submitted!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account request has been sent to the hospital administrator.<br />
            You'll receive an email once your account is approved and activated.
          </p>
          <div className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-left text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{firstName} {lastName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium">{role}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-medium">{dept}</span></div>
          </div>
          <Link to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-chart-2/30 blur-3xl" />
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ── Left panel ── */}
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary shadow-glow">
              <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="font-display text-xl font-bold">MediSpring</div>
          </Link>

          <div>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight">
              Join the <span className="text-gradient">future of care</span>.
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Request access to MediSpring Hospital Suite. Once approved by your administrator,
              you can manage patients, appointments, billing and more.
            </p>
            <div className="mt-10 space-y-4">
              {[
                { icon: ShieldCheck, t: "HIPAA & ISO 27001 compliant", d: "Enterprise-grade security for patient data" },
                { icon: Users, t: "Role-based access", d: "Tailored dashboards for every hospital role" },
                { icon: Stethoscope, t: "Unified EMR", d: "Patient history, prescriptions & lab results in one place" },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-4 rounded-2xl glass p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{f.t}</div>
                    <div className="text-xs text-muted-foreground">{f.d}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">© MediSpring Hospital Suite · HIPAA & ISO 27001 compliant</div>
        </div>

        {/* ── Right form ── */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg rounded-3xl glass p-8 shadow-elevated">

            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary shadow-glow">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold">MediSpring</span>
            </div>

            <h2 className="font-display text-2xl font-bold">Request an account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Complete the form to get workspace access.</p>

            {/* Stepper */}
            <div className="mt-6 flex items-center justify-between">
              {steps.map((s, i) => {
                const num = i + 1;
                const active = num === step;
                const done = num < step;
                return (
                  <div key={s} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition ${done ? "bg-success text-success-foreground" : active ? "gradient-primary text-white shadow-glow" : "bg-muted text-muted-foreground"}`}>
                        {done ? <Check className="h-4 w-4" /> : num}
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                    </div>
                    {num < steps.length && (
                      <div className="mx-2 h-0.5 flex-1 rounded-full bg-muted">
                        <div className={`h-full rounded-full transition-all ${done ? "w-full bg-success" : "w-0"}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {apiError && (
              <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <AnimatePresence mode="wait">

                {/* Step 1 — Personal info */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">First name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" required
                            className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last name</label>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe"
                          className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.com" required
                          className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx"
                          className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2 — Role & Department */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select your role</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {roles.map((r) => (
                          <button key={r} type="button" onClick={() => setRole(r)}
                            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${role === r ? "gradient-primary border-transparent text-white shadow-glow" : "border-border bg-card hover:bg-accent"}`}>
                            {r.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</label>
                      <div className="grid grid-cols-2 gap-2">
                        {departments.map((d) => (
                          <button key={d} type="button" onClick={() => setDept(d)}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${dept === d ? "gradient-primary border-transparent text-white shadow-glow" : "border-border bg-card hover:bg-accent"}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    {role !== "Patient" && (
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee / License ID</label>
                        <div className="relative">
                          <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input value={licenseId} onChange={(e) => setLicenseId(e.target.value)} placeholder="EMP-2024-00187 or MCI-12345"
                            className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3 — Password & Terms */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Create password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                        <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <motion.div className={`h-full rounded-full ${pwColor}`} initial={{ width: 0 }} animate={{ width: `${(pwScore / 4) * 100}%` }} transition={{ duration: 0.3 }} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{pwLabel}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[
                          { ok: pw.length >= 8, l: "8+ chars" },
                          { ok: /[A-Z]/.test(pw), l: "Uppercase" },
                          { ok: /[0-9]/.test(pw), l: "Number" },
                          { ok: /[^A-Za-z0-9]/.test(pw), l: "Special char" },
                        ].map((c) => (
                          <span key={c.l} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.ok ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                            {c.ok ? <Check className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} {c.l}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input type={showConfirm ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                          placeholder="Re-enter password"
                          className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 ${pwMismatch ? "border-destructive" : pwMatch ? "border-success" : "border-input"}`} />
                        <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {pwMismatch && <p className="mt-1.5 text-xs text-destructive font-medium">Passwords do not match</p>}
                      {pwMatch && <p className="mt-1.5 text-xs text-success font-medium">✓ Passwords match</p>}
                    </div>

                    <label className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3 cursor-pointer hover:bg-accent/40 transition">
                      <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded border-input" />
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        I agree to the <a href="#" className="font-semibold text-primary hover:underline">Terms of Service</a> and <a href="#" className="font-semibold text-primary hover:underline">Privacy Policy</a>, and confirm I am an authorised member of this hospital.
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                {step > 1 ? (
                  <button type="button" onClick={() => setStep((s) => s - 1)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent transition">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : (
                  <Link to="/login"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent transition">
                    <ArrowLeft className="h-4 w-4" /> Login
                  </Link>
                )}

                {step < 3 ? (
                  <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext}
                    className="inline-flex items-center gap-1.5 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:opacity-95 disabled:opacity-40">
                    Next <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={!canNext || requestAccount.isPending}
                    className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:opacity-95 disabled:opacity-40">
                    {requestAccount.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                      : <><ShieldCheck className="h-4 w-4" /> Submit request</>
                    }
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
