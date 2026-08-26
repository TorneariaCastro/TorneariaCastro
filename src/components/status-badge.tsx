import { cn } from "@/lib/utils";
import type { StatusOrdemServico, StatusTransacao } from "@/lib/types";

type StatusConhecido = StatusOrdemServico | StatusTransacao;

const CONFIG: Record<StatusConhecido, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  orcado: { label: "Orçado", className: "bg-status-info text-status-info-foreground" },
  em_execucao: { label: "Em Execução", className: "bg-status-info text-status-info-foreground" },
  pronto: { label: "Pronto", className: "bg-status-success text-status-success-foreground" },
  faturado: { label: "Faturado", className: "bg-primary/15 text-primary" },
  cancelado: { label: "Cancelado", className: "bg-status-danger text-status-danger-foreground" },
  pendente: { label: "Pendente", className: "bg-status-warning text-status-warning-foreground" },
  pago: { label: "Pago", className: "bg-status-success text-status-success-foreground" },
  atrasado: { label: "Atrasado", className: "bg-status-danger text-status-danger-foreground" },
};

export function StatusBadge({ status, className }: { status: StatusConhecido; className?: string }) {
  const config = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
