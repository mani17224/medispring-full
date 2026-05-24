import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/panel";

interface Stat { label: string; value: string; tone?: "primary" | "success" | "warning" | "info" | "destructive" }
interface ListItem { title: string; subtitle: string; meta: string; tone?: string }

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  stats: Stat[];
  sections: { title: string; description?: string; items: ListItem[] }[];
}

export function ModulePage({ title, description, icon: Icon, stats, sections }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <button className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent">Filter</button>
            <button className="rounded-xl gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow">+ Add new</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-${s.tone ?? "primary"}/10 text-${s.tone ?? "primary"}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-display text-2xl font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((sec, idx) => (
          <Card key={idx}>
            <CardHeader title={sec.title} description={sec.description} />
            <CardBody className="space-y-2">
              {sec.items.map((it, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-accent/40">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg bg-${it.tone ?? "primary"}/10 text-${it.tone ?? "primary"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{it.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{it.subtitle}</div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">{it.meta}</span>
                </motion.div>
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
