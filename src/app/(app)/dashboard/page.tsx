import { DollarSign, FileClock, ReceiptText, Users } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueExpenseChart } from "@/components/dashboard/revenue-expense-chart";
import { StatusDonutChart } from "@/components/dashboard/status-donut-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { getHistoricoFluxoCaixa, getKpis, getStatusOsDistribuicao } from "@/lib/dashboard-metrics";
import { listClientes } from "@/lib/data/clientes";
import { listOrdensServico } from "@/lib/data/ordens-servico";
import { listTransacoes } from "@/lib/data/transacoes";
import { formatarMoeda } from "@/lib/format";
import { getSessao } from "@/lib/auth/session";

export default async function DashboardPage() {
  const [clientes, ordensServico, transacoes, { isAdmin }] = await Promise.all([
    listClientes(),
    listOrdensServico(),
    listTransacoes(),
    getSessao(),
  ]);

  const kpis = getKpis(clientes, transacoes);
  const statusOs = getStatusOsDistribuicao(ordensServico);
  const historicoFluxoCaixa = getHistoricoFluxoCaixa(transacoes);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground">Visão geral da operação da oficina</p>
        </div>
        {isAdmin && <QuickActions clientes={clientes} />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento (pago)"
          value={formatarMoeda(kpis.faturamentoMensal)}
          icon={DollarSign}
          accent="primary"
        />
        <KpiCard
          label="Contas a Receber"
          value={formatarMoeda(kpis.contasAReceber)}
          icon={ReceiptText}
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
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueExpenseChart data={historicoFluxoCaixa} />
        <StatusDonutChart data={statusOs} />
      </div>
    </div>
  );
}
