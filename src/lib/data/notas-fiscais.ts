import { createClient } from "@/lib/supabase/server";
import type { NotaFiscal, StatusNfse } from "@/lib/types";

interface NotaFiscalRow {
  id: string;
  ordem_servico_id: string;
  numero: string | null;
  codigo_verificacao: string | null;
  status: StatusNfse;
  valor_servico: number;
  aliquota_iss: number;
  valor_iss: number;
  data_emissao: string | null;
  link_pdf: string | null;
  mensagem_erro: string | null;
  ordens_servico:
    | { numero: string; descricao_servico: string; clientes: { nome: string } | { nome: string }[] | null }
    | { numero: string; descricao_servico: string; clientes: { nome: string } | { nome: string }[] | null }[]
    | null;
}

export interface NotaFiscalComContexto extends NotaFiscal {
  ordemServicoNumero: string;
  descricaoServico: string;
  clienteNome: string;
}

function primeiro<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function toNotaFiscal(row: NotaFiscalRow): NotaFiscalComContexto {
  const os = primeiro(row.ordens_servico);
  const cliente = os ? primeiro(os.clientes) : null;

  return {
    id: row.id,
    ordemServicoId: row.ordem_servico_id,
    numero: row.numero ?? undefined,
    codigoVerificacao: row.codigo_verificacao ?? undefined,
    status: row.status,
    valorServico: row.valor_servico,
    aliquotaIss: row.aliquota_iss,
    valorIss: row.valor_iss,
    dataEmissao: row.data_emissao ?? undefined,
    linkPdf: row.link_pdf ?? undefined,
    mensagemErro: row.mensagem_erro ?? undefined,
    ordemServicoNumero: os?.numero ?? "",
    descricaoServico: os?.descricao_servico ?? "",
    clienteNome: cliente?.nome ?? "",
  };
}

const SELECT_NOTA_FISCAL = "*, ordens_servico(numero, descricao_servico, clientes(nome))";

export async function listNotasFiscais(): Promise<NotaFiscalComContexto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notas_fiscais")
    .select(SELECT_NOTA_FISCAL)
    .order("data_emissao", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data as unknown as NotaFiscalRow[]).map(toNotaFiscal);
}

export async function getNotaFiscalPorOrdemServico(ordemServicoId: string): Promise<NotaFiscal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notas_fiscais")
    .select("*")
    .eq("ordem_servico_id", ordemServicoId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    ordemServicoId: data.ordem_servico_id,
    numero: data.numero ?? undefined,
    codigoVerificacao: data.codigo_verificacao ?? undefined,
    status: data.status,
    valorServico: data.valor_servico,
    aliquotaIss: data.aliquota_iss,
    valorIss: data.valor_iss,
    dataEmissao: data.data_emissao ?? undefined,
    linkPdf: data.link_pdf ?? undefined,
    mensagemErro: data.mensagem_erro ?? undefined,
  };
}
