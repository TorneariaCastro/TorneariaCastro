import { createClient } from "@/lib/supabase/server";
import type { ItemMaoDeObra, ItemMaterial, OrdemServico, StatusOrdemServico } from "@/lib/types";

interface OrdemServicoRow {
  id: string;
  numero: string;
  cliente_id: string;
  status: StatusOrdemServico;
  descricao_servico: string;
  data_abertura: string;
  previsao_entrega: string | null;
  data_conclusao: string | null;
  observacoes: string | null;
  clientes: { nome: string } | { nome: string }[] | null;
  itens_mao_de_obra: { id: string; descricao: string; horas: number; valor_hora: number }[];
  itens_materiais: { id: string; descricao: string; quantidade: number; unidade: string; valor_unitario: number }[];
}

function nomeCliente(clientes: OrdemServicoRow["clientes"]): string {
  if (!clientes) return "";
  return Array.isArray(clientes) ? (clientes[0]?.nome ?? "") : clientes.nome;
}

function toOrdemServico(row: OrdemServicoRow): OrdemServico {
  const maoDeObra: ItemMaoDeObra[] = row.itens_mao_de_obra.map((i) => ({
    id: i.id,
    descricao: i.descricao,
    horas: i.horas,
    valorHora: i.valor_hora,
  }));
  const materiais: ItemMaterial[] = row.itens_materiais.map((i) => ({
    id: i.id,
    descricao: i.descricao,
    quantidade: i.quantidade,
    unidade: i.unidade,
    valorUnitario: i.valor_unitario,
  }));

  return {
    id: row.id,
    numero: row.numero,
    clienteId: row.cliente_id,
    clienteNome: nomeCliente(row.clientes),
    status: row.status,
    descricaoServico: row.descricao_servico,
    maoDeObra,
    materiais,
    dataAbertura: row.data_abertura,
    previsaoEntrega: row.previsao_entrega ?? undefined,
    dataConclusao: row.data_conclusao ?? undefined,
    observacoes: row.observacoes ?? undefined,
  };
}

const SELECT_ORDEM_SERVICO = "*, clientes(nome), itens_mao_de_obra(*), itens_materiais(*)";

export async function listOrdensServico(): Promise<OrdemServico[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .select(SELECT_ORDEM_SERVICO)
    .order("data_abertura", { ascending: false });
  if (error) throw error;
  return (data as unknown as OrdemServicoRow[]).map(toOrdemServico);
}

export async function listOrdensServicoPorCliente(clienteId: string): Promise<OrdemServico[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .select(SELECT_ORDEM_SERVICO)
    .eq("cliente_id", clienteId)
    .order("data_abertura", { ascending: false });
  if (error) throw error;
  return (data as unknown as OrdemServicoRow[]).map(toOrdemServico);
}
