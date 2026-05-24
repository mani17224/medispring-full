import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, Bell, CalendarCheck, FlaskConical, Receipt, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/panel";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useApi";

export const Route = createFileRoute("/notifications")({ component: Notifications });

const typeIcon: Record<string, any> = {
  EMERGENCY: AlertTriangle, APPOINTMENT: CalendarCheck, BILLING: Receipt,
  LAB_RESULT: FlaskConical, GENERAL: Bell, SYSTEM: Bell,
};
const typeTone: Record<string, string> = {
  EMERGENCY: "destructive", APPOINTMENT: "primary", BILLING: "warning",
  LAB_RESULT: "info", GENERAL: "success", SYSTEM: "muted",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function Notifications() {
  const { data, isLoading } = useNotifications({ limit: 30 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unread} unread alerts across the hospital.`}
        actions={
          <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending || unread === 0}
            className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
            {markAllRead.isPending ? "Marking…" : "Mark all read"}
          </button>
        }
      />

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No notifications</div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n: any, i: number) => {
                const Icon = typeIcon[n.type] ?? Bell;
                const tone = typeTone[n.type] ?? "primary";
                return (
                  <motion.div key={n.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => !n.isRead && markRead.mutate(n.id)}
                    className={`flex items-start gap-4 p-5 cursor-pointer hover:bg-accent/30 transition-colors ${!n.isRead ? "bg-primary/5" : ""}`}>
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-${tone}/10 text-${tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{n.title}</span>
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
