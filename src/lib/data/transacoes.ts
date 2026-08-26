import { createClient } from "@/lib/supabase/server";
import type { CategoriaDespesa, MetodoRecebimento, StatusTransacao, TipoTransacao, TransacaoFinanceira } from "@/lib/types";

interface TransacaoRow {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  categoria: CategoriaDespesa | null;
  cliente_id: string | null;
  ordem_servico_id: string | null;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: StatusTransacao;
  metodo: MetodoRecebimento | null;
  clientes: { nome: string } | { nome: string }[] | null;
}

function nomeCliente(clientes: TransacaoRow["clientes"]): string | undefined {
  if (!clientes) return undefined;
  return Array.isArray(clientes) ? clientes[0]?.nome : clientes.nome;
}

function toTransacao(row: TransacaoRow): TransacaoFinanceira {
  return {
    id: row.id,
    tipo: row.tipo,
    descricao: row.descricao,
    categoria: row.categoria ?? undefined,
    clienteId: row.cliente_id ?? undefined,
    clienteNome: nomeCliente(row.clientes),
    ordemServicoId: row.ordem_servico_id ?? undefined,
    valor: row.valor,
    dataVencimento: row.data_vencimento,
    dataPagamento: row.data_pagamento ?? undefined,
    status: row.status,
    metodo: row.metodo ?? undefined,
  };
}

export async function listTransacoes(): Promise<TransacaoFinanceira[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transacoes_financeiras")
    .select("*, clientes(nome)")
    .order("data_vencimento", { ascending: false });
  if (error) throw error;
  return (data as unknown as TransacaoRow[]).map(toTransacao);
}

export async function listTransacoesPorCliente(clienteId: string): Promise<TransacaoFinanceira[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transacoes_financeiras")
    .select("*, clientes(nome)")
    .eq("cliente_id", clienteId)
    .order("data_vencimento", { ascending: false });
  if (error) throw error;
  return (data as unknown as TransacaoRow[]).map(toTransacao);
}
