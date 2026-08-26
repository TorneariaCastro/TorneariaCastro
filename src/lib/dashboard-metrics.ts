import type { Cliente, OrdemServico, StatusOrdemServico, TransacaoFinanceira } from "@/lib/types";

export function getKpis(clientes: Cliente[], transacoes: TransacaoFinanceira[]) {
  const faturamentoMensal = transacoes
    .filter((t) => t.tipo === "receita" && t.status === "pago")
    .reduce((total, t) => total + t.valor, 0);

  const contasAReceber = transacoes
    .filter((t) => t.tipo === "receita" && (t.status === "pendente" || t.status === "atrasado"))
    .reduce((total, t) => total + t.valor, 0);

  const contasAPagar = transacoes
    .filter((t) => t.tipo === "despesa" && t.status === "pendente")
    .reduce((total, t) => total + t.valor, 0);

  const clientesAtivos = clientes.filter((c) => c.ativo).length;

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

export function getStatusOsDistribuicao(ordensServico: OrdemServico[]) {
  const contagem = new Map<StatusOrdemServico, number>();
  for (const os of ordensServico) {
    contagem.set(os.status, (contagem.get(os.status) ?? 0) + 1);
  }
  return Array.from(contagem.entries()).map(([status, quantidade]) => ({
    status,
    label: LABEL_STATUS_OS[status],
    quantidade,
    cor: COR_STATUS_OS[status],
  }));
}

const LABEL_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function getHistoricoFluxoCaixa(transacoes: TransacaoFinanceira[], meses = 6) {
  const hoje = new Date();
  const janelas: { chave: string; mes: string; receitas: number; despesas: number }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    janelas.push({ chave: `${d.getFullYear()}-${d.getMonth()}`, mes: LABEL_MES[d.getMonth()], receitas: 0, despesas: 0 });
  }
  const porChave = new Map(janelas.map((j) => [j.chave, j]));

  for (const t of transacoes) {
    if (t.status !== "pago" || !t.dataPagamento) continue;
    const d = new Date(t.dataPagamento);
    const chave = `${d.getFullYear()}-${d.getMonth()}`;
    const janela = porChave.get(chave);
    if (!janela) continue;
    if (t.tipo === "receita") janela.receitas += t.valor;
    else janela.despesas += t.valor;
  }

  return janelas.map(({ mes, receitas, despesas }) => ({ mes, receitas, despesas }));
}
