import { DollarSign, FileClock, ReceiptText, Users } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueExpenseChart } from "@/components/dashboard/revenue-expense-chart";
import { StatusDonutChart } from "@/components/dashboard/status-donut-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { getKpis, getStatusOsDistribuicao } from "@/lib/dashboard-metrics";
import { historicoFluxoCaixaMock } from "@/lib/mock-data/transacoes";
import { formatarMoeda } from "@/lib/format";

export default function DashboardPage() {
  const kpis = getKpis();
  const statusOs = getStatusOsDistribuicao();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground">Visão geral da operação da oficina</p>
        </div>
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento Mensal"
          value={formatarMoeda(kpis.faturamentoMensal)}
          icon={DollarSign}
          trend={{ value: "+12,4% vs. mês anterior", direcao: "up" }}
          accent="primary"
        />
        <KpiCard
          label="Contas a Receber"
          value={formatarMoeda(kpis.contasAReceber)}
          icon={ReceiptText}
          trend={{ value: "1 fatura atrasada", direcao: "down" }}
          accent="warning"
        />
        <KpiCard
          label="Contas a Pagar"
          value={formatarMoeda(kpis.contasAPagar)}
          icon={FileClock}
          accent="danger"
        />
        <KpiCard
          label="Clientes Ativos"
          value={String(kpis.clientesAtivos)}
          icon={Users}
          trend={{ value: "+1 este mês", direcao: "up" }}
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueExpenseChart data={historicoFluxoCaixaMock} />
        <StatusDonutChart data={statusOs} />
      </div>
    </div>
  );
}
