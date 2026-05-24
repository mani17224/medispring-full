import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { isLoggedIn } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh px-4">
      <div className="max-w-md text-center">
        <div className="text-gradient font-display text-7xl font-bold">404</div>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow">
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = ["/login", "/register", "/request-account", "/forgot-password"].some((p) => path.startsWith(p));

  // Client-side auth guard — redirect to /login if not authenticated
  if (!isAuthRoute && !isLoggedIn()) {
    if (typeof window !== "undefined") window.location.replace("/login");
    return null;
  }

  return isAuthRoute ? <Outlet /> : <AppShell><Outlet /></AppShell>;
}
