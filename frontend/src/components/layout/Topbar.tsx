import { Bell, Menu, Moon, Search, Sun, Plus, LogOut } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/hooks/useApi";
import { Link } from "@tanstack/react-router";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { data } = useNotifications({ isRead: false, limit: 1 });

  const unreadCount = data?.meta?.total ?? 0;
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "DR";
  const displayName = user ? `${user.firstName} ${user.lastName}` : "Doctor";
  const roleLabel = user?.role ?? "Admin";

  return (
    <header className="sticky top-0 z-30 glass">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button onClick={onMenu} className="lg:hidden rounded-lg p-2 hover:bg-accent">
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden md:flex flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search patients, doctors, invoices…"
            className="w-full rounded-xl border border-input bg-background/60 py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-block">
            ⌘K
          </kbd>
        </div>

        <div className="flex-1 md:hidden" />

        <Link to="/patients"
          className="hidden md:inline-flex items-center gap-2 rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow hover:opacity-95">
          <Plus className="h-4 w-4" /> New Patient
        </Link>

        <button onClick={toggle} className="rounded-xl border border-border bg-card p-2 hover:bg-accent">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Link to="/notifications" className="relative rounded-xl border border-border bg-card p-2 hover:bg-accent">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-1 pr-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-sm font-bold text-white">
            {initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="text-[11px] text-muted-foreground">{roleLabel}</div>
          </div>
        </div>

        <button onClick={() => logout()} className="rounded-xl border border-border bg-card p-2 hover:bg-destructive/10 hover:text-destructive" title="Logout">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
