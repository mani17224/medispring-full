import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "info" | "destructive";
  data: number[];
  index?: number;
}

const toneMap = {
  primary: { bg: "bg-primary/10", fg: "text-primary", stroke: "var(--color-primary)" },
  success: { bg: "bg-success/10", fg: "text-success", stroke: "var(--color-success)" },
  warning: { bg: "bg-warning/15", fg: "text-warning", stroke: "var(--color-warning)" },
  info: { bg: "bg-info/10", fg: "text-info", stroke: "var(--color-info)" },
  destructive: { bg: "bg-destructive/10", fg: "text-destructive", stroke: "var(--color-destructive)" },
};

export function StatCard({ label, value, delta, icon: Icon, tone = "primary", data, index = 0 }: Props) {
  const t = toneMap[tone];
  const positive = delta >= 0;
  const chartData = data.map((v, i) => ({ i, v }));
  const id = `spark-${label.replace(/\s/g, "")}-${tone}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-elevated transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</div>
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl", t.bg, t.fg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
            positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta)}%
        </span>
        <span className="text-xs text-muted-foreground">vs last month</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-14 opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={t.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={t.stroke} strokeWidth={2} fill={`url(#${id})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
