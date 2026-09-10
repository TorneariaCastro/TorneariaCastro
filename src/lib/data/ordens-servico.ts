import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  ItemMaoDeObra,
  ItemMaterial,
  ItemServico,
  OrdemServico,
  StatusOrdemServico,
} from "@/lib/types";

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
  token_compartilhamento: string;
  aprovado_em: string | null;
  recusado_em: string | null;
  link_expira_em: string | null;
  clientes: { nome: string } | { nome: string }[] | null;
  itens_servico: { id: string; descricao: string; quantidade: number; valor_unitario: number }[];
  itens_mao_de_obra: { id: string; descricao: string; horas: number; valor_hora: number }[];
  itens_materiais: { id: string; descricao: string; quantidade: number; unidade: string; valor_unitario: number }[];
}

function nomeCliente(clientes: OrdemServicoRow["clientes"]): string {
  if (!clientes) return "";
  return Array.isArray(clientes) ? (clientes[0]?.nome ?? "") : clientes.nome;
}

function toOrdemServico(row: OrdemServicoRow): OrdemServico {
  const servicos: ItemServico[] = (row.itens_servico ?? []).map((i) => ({
    id: i.id,
    descricao: i.descricao,
    quantidade: i.quantidade,
    valorUnitario: i.valor_unitario,
  }));
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
    servicos,
    maoDeObra,
    materiais,
    dataAbertura: row.data_abertura,
    previsaoEntrega: row.previsao_entrega ?? undefined,
    dataConclusao: row.data_conclusao ?? undefined,
    observacoes: row.observacoes ?? undefined,
    tokenCompartilhamento: row.token_compartilhamento,
    aprovadoEm: row.aprovado_em ?? undefined,
    recusadoEm: row.recusado_em ?? undefined,
    linkExpiraEm: row.link_expira_em ?? undefined,
  };
}

const SELECT_ORDEM_SERVICO =
  "*, clientes(nome), itens_servico(*), itens_mao_de_obra(*), itens_materiais(*)";

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

export interface ValoresOrdemServico {
  servicos: number;
  maoDeObra: number;
  materiais: number;
  total: number;
}

/**
 * Fonte única dos valores quando só existe o id da OS (sem o objeto carregado).
 * Existe para que a conta a receber e a página pública do orçamento nunca
 * divirjam do que a tela mostra — a fórmula vive num lugar só.
 *
 * Devolve o total já separado por bloco porque a página pública precisa saber
 * QUANTO veio de mão de obra e materiais para fechar a conta na frente do
 * cliente — sem nunca enviar os itens em si ao navegador dele.
 *
 * Aceita tanto o client autenticado quanto o de service role (página pública).
 */
export async function calcularValoresOrdemServico(
  supabase: SupabaseClient,
  ordemServicoId: string,
): Promise<ValoresOrdemServico> {
  const vazio = { servicos: 0, maoDeObra: 0, materiais: 0, total: 0 };

  const { data } = await supabase
    .from("ordens_servico")
    .select(
      "itens_servico(quantidade, valor_unitario), itens_mao_de_obra(horas, valor_hora), itens_materiais(quantidade, valor_unitario)",
    )
    .eq("id", ordemServicoId)
    .maybeSingle();

  if (!data) return vazio;

  const itensServico = (data.itens_servico ?? []) as Array<{ quantidade: number; valor_unitario: number }>;
  const itensMaoDeObra = (data.itens_mao_de_obra ?? []) as Array<{ horas: number; valor_hora: number }>;
  const itensMateriais = (data.itens_materiais ?? []) as Array<{ quantidade: number; valor_unitario: number }>;

  const servicos = itensServico.reduce((t, i) => t + i.quantidade * i.valor_unitario, 0);
  const maoDeObra = itensMaoDeObra.reduce((t, i) => t + i.horas * i.valor_hora, 0);
  const materiais = itensMateriais.reduce((t, i) => t + i.quantidade * i.valor_unitario, 0);

  return { servicos, maoDeObra, materiais, total: servicos + maoDeObra + materiais };
}

export async function calcularTotalOrdemServico(
  supabase: SupabaseClient,
  ordemServicoId: string,
): Promise<number> {
  const { total } = await calcularValoresOrdemServico(supabase, ordemServicoId);
  return total;
}

export async function getOrdemServico(id: string): Promise<OrdemServico | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .select(SELECT_ORDEM_SERVICO)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toOrdemServico(data as unknown as OrdemServicoRow) : null;
}
