import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; direcao: "up" | "down" };
  accent?: "primary" | "success" | "warning" | "danger";
}

const ACCENT_CLASSES: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  primary: "bg-primary/12 text-primary",
  success: "bg-status-success text-status-success-foreground",
  warning: "bg-status-warning text-status-warning-foreground",
  danger: "bg-status-danger text-status-danger-foreground",
};

export function KpiCard({ label, value, icon: Icon, trend, accent = "primary" }: KpiCardProps) {
  return (
    <Card className="gap-3 py-5">
      <CardContent className="flex items-start justify-between px-5">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.direcao === "up" ? "text-status-success-foreground" : "text-status-danger-foreground",
              )}
            >
              {trend.direcao === "up" ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", ACCENT_CLASSES[accent])}>
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </CardContent>
    </Card>
  );
}
