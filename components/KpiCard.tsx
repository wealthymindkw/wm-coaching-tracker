import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: "blue" | "green" | "orange" | "purple" | "amber";
}

const accents = {
  blue:   { icon: "bg-brand-500/10 text-brand-500",    border: "border-brand-500/20"   },
  green:  { icon: "bg-emerald-500/10 text-emerald-500", border: "border-emerald-500/20" },
  orange: { icon: "bg-orange-500/10 text-orange-500",   border: "border-orange-500/20"  },
  purple: { icon: "bg-purple-500/10 text-purple-500",   border: "border-purple-500/20"  },
  amber:  { icon: "bg-amber-500/10 text-amber-500",     border: "border-amber-500/20"   },
};

export function KpiCard({ title, value, subtitle, icon: Icon, accent = "blue" }: KpiCardProps) {
  const s = accents[accent];
  return (
    <div className={clsx("rounded-xl border bg-[hsl(var(--card))] p-5 shadow-sm hover:shadow-md transition-shadow", s.border)}>
      <div className="flex items-start justify-between mb-4">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", s.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{value}</p>
      <p className="text-sm font-medium text-[hsl(var(--foreground))] mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{subtitle}</p>}
    </div>
  );
}
