"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/auth/session";
import type { StatusOrdemServico } from "@/lib/types";

export interface CriarOrdemServicoState {
  error?: string;
}

async function proximoNumero(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const ano = new Date().getFullYear();
  const { count } = await supabase
    .from("ordens_servico")
    .select("id", { count: "exact", head: true })
    .gte("data_abertura", `${ano}-01-01`);
  const sequencial = String((count ?? 0) + 1).padStart(4, "0");
  return `OS-${ano}-${sequencial}`;
}

export async function criarOrdemServico(
  _prevState: CriarOrdemServicoState | undefined,
  formData: FormData,
): Promise<CriarOrdemServicoState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) {
    return { error: "Consultores não podem criar ordens de serviço." };
  }

  const supabase = await createClient();

  const clienteId = String(formData.get("clienteId") ?? "");
  const descricao = String(formData.get("descricao") ?? "");
  const status = String(formData.get("status") ?? "rascunho");

  if (!clienteId || !descricao) {
    return { error: "Preencha cliente e descrição do serviço." };
  }

  const numero = await proximoNumero(supabase);

  const { error } = await supabase.from("ordens_servico").insert({
    numero,
    cliente_id: clienteId,
    status,
    descricao_servico: descricao,
  });

  if (error) {
    return { error: "Não foi possível criar a ordem de serviço." };
  }

  revalidatePath("/ordens-servico");
  revalidatePath("/dashboard");
  return {};
}

export interface CompartilharOrcamentoState {
  error?: string;
  link?: string;
}

export async function compartilharOrcamento(ordemServicoId: string): Promise<CompartilharOrcamentoState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) {
    return { error: "Consultores não podem compartilhar orçamentos." };
  }

  const supabase = await createClient();
  const linkExpiraEm = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("ordens_servico")
    .update({ link_expira_em: linkExpiraEm })
    .eq("id", ordemServicoId)
    .select("token_compartilhamento")
    .single();

  if (error || !data) {
    return { error: "Não foi possível gerar o link de compartilhamento." };
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  revalidatePath(`/ordens-servico/${ordemServicoId}`);
  return { link: `${base}/orcamento/${data.token_compartilhamento}` };
}

export interface ConverterEmServicoState {
  error?: string;
}

export async function converterEmServico(ordemServicoId: string): Promise<ConverterEmServicoState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) {
    return { error: "Consultores não podem converter orçamentos em serviço." };
  }

  const supabase = await createClient();
  const { data: os, error: fetchError } = await supabase
    .from("ordens_servico")
    .select("status, aprovado_em")
    .eq("id", ordemServicoId)
    .maybeSingle();

  if (fetchError || !os) {
    return { error: "Ordem de serviço não encontrada." };
  }
  if (!os.aprovado_em) {
    return { error: "Orçamento ainda não foi aprovado pelo cliente." };
  }
  if (os.status !== "orcado") {
    return { error: "Esta ordem de serviço não está mais no status Orçado." };
  }

  const { error } = await supabase.from("ordens_servico").update({ status: "em_execucao" }).eq("id", ordemServicoId);

  if (error) {
    return { error: "Não foi possível converter o orçamento em serviço." };
  }

  revalidatePath(`/ordens-servico/${ordemServicoId}`);
  revalidatePath("/ordens-servico");
  revalidatePath("/dashboard");
  return {};
}

export interface ItemState {
  error?: string;
}

/**
 * Depois que o cliente aprova o orçamento, os valores não podem mais mudar —
 * ele aprovou um preço específico.
 */
async function garantirEdicaoPermitida(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ordemServicoId: string,
): Promise<string | null> {
  const { data: os } = await supabase
    .from("ordens_servico")
    .select("aprovado_em")
    .eq("id", ordemServicoId)
    .maybeSingle();

  if (!os) return "Ordem de serviço não encontrada.";
  if (os.aprovado_em) return "O cliente já aprovou este orçamento — os valores não podem mais ser alterados.";
  return null;
}

function revalidarOrdem(ordemServicoId: string) {
  revalidatePath(`/ordens-servico/${ordemServicoId}`);
  revalidatePath("/ordens-servico");
  revalidatePath("/dashboard");
}

export async function adicionarMaoDeObra(ordemServicoId: string, formData: FormData): Promise<ItemState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) return { error: "Consultores não podem lançar valores." };

  const descricao = String(formData.get("descricao") ?? "").trim();
  const horas = Number(String(formData.get("horas") ?? "").replace(",", "."));
  const valorHora = Number(String(formData.get("valorHora") ?? "").replace(",", "."));

  if (!descricao) return { error: "Descreva a mão de obra." };
  if (!Number.isFinite(horas) || horas <= 0) return { error: "Informe a quantidade de horas." };
  if (!Number.isFinite(valorHora) || valorHora <= 0) return { error: "Informe o valor por hora." };

  const supabase = await createClient();
  const bloqueio = await garantirEdicaoPermitida(supabase, ordemServicoId);
  if (bloqueio) return { error: bloqueio };

  const { error } = await supabase.from("itens_mao_de_obra").insert({
    ordem_servico_id: ordemServicoId,
    descricao,
    horas,
    valor_hora: valorHora,
  });
  if (error) return { error: "Não foi possível lançar a mão de obra." };

  revalidarOrdem(ordemServicoId);
  return {};
}

export async function adicionarMaterial(ordemServicoId: string, formData: FormData): Promise<ItemState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) return { error: "Consultores não podem lançar valores." };

  const descricao = String(formData.get("descricao") ?? "").trim();
  const quantidade = Number(String(formData.get("quantidade") ?? "").replace(",", "."));
  const unidade = String(formData.get("unidade") ?? "").trim() || "un";
  const valorUnitario = Number(String(formData.get("valorUnitario") ?? "").replace(",", "."));

  if (!descricao) return { error: "Descreva o material." };
  if (!Number.isFinite(quantidade) || quantidade <= 0) return { error: "Informe a quantidade." };
  if (!Number.isFinite(valorUnitario) || valorUnitario <= 0) return { error: "Informe o valor unitário." };

  const supabase = await createClient();
  const bloqueio = await garantirEdicaoPermitida(supabase, ordemServicoId);
  if (bloqueio) return { error: bloqueio };

  const { error } = await supabase.from("itens_materiais").insert({
    ordem_servico_id: ordemServicoId,
    descricao,
    quantidade,
    unidade,
    valor_unitario: valorUnitario,
  });
  if (error) return { error: "Não foi possível lançar o material." };

  revalidarOrdem(ordemServicoId);
  return {};
}

export async function removerItem(
  tipo: "mao_de_obra" | "material",
  itemId: string,
  ordemServicoId: string,
): Promise<ItemState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) return { error: "Consultores não podem remover lançamentos." };

  const supabase = await createClient();
  const bloqueio = await garantirEdicaoPermitida(supabase, ordemServicoId);
  if (bloqueio) return { error: bloqueio };

  const tabela = tipo === "mao_de_obra" ? "itens_mao_de_obra" : "itens_materiais";
  const { error } = await supabase.from(tabela).delete().eq("id", itemId);
  if (error) return { error: "Não foi possível remover o lançamento." };

  revalidarOrdem(ordemServicoId);
  return {};
}

export interface StatusState {
  error?: string;
}

/** O que pode virar o quê. Impede pular etapas ou reviver uma OS encerrada. */
const TRANSICOES_PERMITIDAS: Record<StatusOrdemServico, StatusOrdemServico[]> = {
  rascunho: ["orcado", "cancelado"],
  orcado: ["em_execucao", "cancelado"],
  em_execucao: ["pronto", "cancelado"],
  pronto: ["faturado", "cancelado"],
  faturado: [],
  cancelado: [],
};

export async function avancarStatus(
  ordemServicoId: string,
  novoStatus: StatusOrdemServico,
): Promise<StatusState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) return { error: "Consultores não podem alterar o status da ordem de serviço." };

  const supabase = await createClient();
  const { data: os } = await supabase
    .from("ordens_servico")
    .select("status")
    .eq("id", ordemServicoId)
    .maybeSingle();

  if (!os) return { error: "Ordem de serviço não encontrada." };

  const permitidos = TRANSICOES_PERMITIDAS[os.status as StatusOrdemServico] ?? [];
  if (!permitidos.includes(novoStatus)) {
    return { error: "Essa mudança de status não é permitida a partir da situação atual." };
  }

  const atualizacao: Record<string, unknown> = { status: novoStatus };
  if (novoStatus === "pronto") atualizacao.data_conclusao = new Date().toISOString();

  const { error } = await supabase.from("ordens_servico").update(atualizacao).eq("id", ordemServicoId);
  if (error) return { error: "Não foi possível alterar o status." };

  if (novoStatus === "faturado") {
    await gerarContaAReceber(supabase, ordemServicoId);
  }

  revalidarOrdem(ordemServicoId);
  revalidatePath("/financeiro");
  return {};
}

/**
 * Elo entre o serviço executado e o dinheiro: ao faturar a OS, cria a conta a
 * receber correspondente no Financeiro. É lá que fica o botão de emitir a
 * NFS-e, então sem isso a nota fiscal fica inalcançável.
 *
 * Não duplica: se já existe lançamento para a mesma OS, não cria outro.
 */
async function gerarContaAReceber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ordemServicoId: string,
): Promise<void> {
  const { data: jaExiste } = await supabase
    .from("transacoes_financeiras")
    .select("id")
    .eq("ordem_servico_id", ordemServicoId)
    .eq("tipo", "receita")
    .maybeSingle();

  if (jaExiste) return;

  const { data: os } = await supabase
    .from("ordens_servico")
    .select("numero, cliente_id, descricao_servico, itens_mao_de_obra(horas, valor_hora), itens_materiais(quantidade, valor_unitario)")
    .eq("id", ordemServicoId)
    .maybeSingle();

  if (!os) return;

  const maoDeObra = (os.itens_mao_de_obra ?? []) as Array<{ horas: number; valor_hora: number }>;
  const materiais = (os.itens_materiais ?? []) as Array<{ quantidade: number; valor_unitario: number }>;
  const valor =
    maoDeObra.reduce((t, i) => t + i.horas * i.valor_hora, 0) +
    materiais.reduce((t, i) => t + i.quantidade * i.valor_unitario, 0);

  if (valor <= 0) return;

  // Vencimento padrão: 30 dias. O prazo real pode ser ajustado no Financeiro.
  const vencimento = new Date();
  vencimento.setDate(vencimento.getDate() + 30);

  await supabase.from("transacoes_financeiras").insert({
    tipo: "receita",
    descricao: `${os.numero} — ${os.descricao_servico}`,
    cliente_id: os.cliente_id,
    ordem_servico_id: ordemServicoId,
    valor,
    data_vencimento: vencimento.toISOString(),
    status: "pendente",
  });
}
