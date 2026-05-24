import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: Login });

const roles = ["Admin", "Doctor", "Nurse", "Receptionist", "Patient"];

function Login() {
  const [show, setShow] = useState(false);
  const [role, setRole] = useState("Admin");
  const [email, setEmail] = useState("admin@medispring.com");
  const [password, setPassword] = useState("medispring123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-chart-2/30 blur-3xl" />
      </div>
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary shadow-glow">
              <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="font-display text-xl font-bold">MediSpring</div>
          </Link>
          <div>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight">
              The operating system for <span className="text-gradient">modern hospitals</span>.
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Patients, billing, EMR, pharmacy, lab and analytics — unified in one beautifully designed suite.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[{ v: "12k+", l: "Patients" }, { v: "98%", l: "Satisfaction" }, { v: "24/7", l: "Live support" }].map((s) => (
                <div key={s.l} className="rounded-2xl glass p-4">
                  <div className="font-display text-2xl font-bold text-gradient">{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">© MediSpring Hospital Suite · HIPAA & ISO 27001 compliant</div>
        </div>
        <div className="flex items-center justify-center p-6 lg:p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl glass p-8 shadow-elevated">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary shadow-glow">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold">MediSpring</span>
            </div>
            <h2 className="font-display text-2xl font-bold">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your hospital workspace.</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${role === r ? "gradient-primary text-white shadow-glow" : "border border-border bg-card hover:bg-accent"}`}>
                  {r}
                </button>
              ))}
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.com" required
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2"><input type="checkbox" className="rounded border-input" /> Remember me</label>
                <a href="#" className="font-semibold text-primary hover:underline">Forgot password?</a>
              </div>
              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-95 disabled:opacity-60">
                {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <ShieldCheck className="h-4 w-4" />}
                {loading ? "Signing in…" : `Sign in as ${role}`}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                New here? <Link to="/request-account" className="font-semibold text-primary hover:underline">Request an account</Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
