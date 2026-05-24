import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, X } from "lucide-react";
import { navItems, logoutItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface Props { open: boolean; onClose: () => void; }

export function Sidebar({ open, onClose }: Props) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { logout, user } = useAuth();

  return (
    <>
      <div onClick={onClose}
        className={cn("fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0")} />
      <aside className={cn(
        "fixed lg:sticky top-0 z-50 h-screen w-72 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-glow">
              <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-bold tracking-tight">MediSpring</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Hospital Suite</div>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden rounded-md p-1.5 hover:bg-sidebar-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-thin h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Workspace</div>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = path === item.to;
              return (
                <li key={item.to}>
                  <Link to={item.to} onClick={onClose}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
                    {active && (
                      <motion.span layoutId="nav-indicator"
                        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full gradient-primary" />
                    )}
                    <item.icon className={cn("h-[18px] w-[18px] transition-colors", active && "text-primary")} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-4 border-t border-sidebar-border">
            <button onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 hover:bg-destructive/10 hover:text-destructive">
              <logoutItem.icon className="h-[18px] w-[18px]" />
              {logoutItem.label}
            </button>
          </div>

          {user && (
            <div className="mt-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-sm font-bold text-white shrink-0">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{user.firstName} {user.lastName}</div>
                  <div className="text-[11px] text-muted-foreground">{user.role}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 rounded-2xl gradient-primary p-4 text-white shadow-glow">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Pro plan</div>
            <div className="mt-1 text-sm font-semibold">Unlock AI insights</div>
            <p className="mt-1 text-xs opacity-90">Disease prediction, revenue forecasting & more.</p>
            <button className="mt-3 w-full rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm hover:bg-white/25">
              Upgrade now
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
