"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/auth/session";

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
