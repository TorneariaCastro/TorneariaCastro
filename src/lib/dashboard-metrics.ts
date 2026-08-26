import { clientesMock } from "@/lib/mock-data/clientes";
import { ordensServicoMock } from "@/lib/mock-data/ordens-servico";
import { transacoesMock } from "@/lib/mock-data/transacoes";
import type { StatusOrdemServico } from "@/lib/types";

export function getKpis() {
  const faturamentoMensal = transacoesMock
    .filter((t) => t.tipo === "receita" && t.status === "pago")
    .reduce((total, t) => total + t.valor, 0);

  const contasAReceber = transacoesMock
    .filter((t) => t.tipo === "receita" && (t.status === "pendente" || t.status === "atrasado"))
    .reduce((total, t) => total + t.valor, 0);

  const contasAPagar = transacoesMock
    .filter((t) => t.tipo === "despesa" && t.status === "pendente")
    .reduce((total, t) => total + t.valor, 0);

  const clientesAtivos = clientesMock.filter((c) => c.ativo).length;

  return { faturamentoMensal, contasAReceber, contasAPagar, clientesAtivos };
}

const LABEL_STATUS_OS: Record<StatusOrdemServico, string> = {
  rascunho: "Rascunho",
  orcado: "Orçado",
  em_execucao: "Em Execução",
  pronto: "Pronto",
  faturado: "Faturado",
  cancelado: "Cancelado",
};

const COR_STATUS_OS: Record<StatusOrdemServico, string> = {
  rascunho: "var(--muted-foreground)",
  orcado: "var(--chart-2)",
  em_execucao: "var(--chart-1)",
  pronto: "var(--chart-3)",
  faturado: "var(--chart-4)",
  cancelado: "var(--destructive)",
};

export function getStatusOsDistribuicao() {
  const contagem = new Map<StatusOrdemServico, number>();
  for (const os of ordensServicoMock) {
    contagem.set(os.status, (contagem.get(os.status) ?? 0) + 1);
  }
  return Array.from(contagem.entries()).map(([status, quantidade]) => ({
    status,
    label: LABEL_STATUS_OS[status],
    quantidade,
    cor: COR_STATUS_OS[status],
  }));
}
