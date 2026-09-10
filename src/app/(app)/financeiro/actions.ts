"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/auth/session";

export interface TransacaoState {
  error?: string;
}

function revalidarFinanceiro() {
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
}

export async function criarTransacao(formData: FormData): Promise<TransacaoState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) return { error: "Consultores não podem lançar movimentações." };

  const tipo = String(formData.get("tipo") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = Number(String(formData.get("valor") ?? "").replace(/\./g, "").replace(",", "."));
  const dataVencimento = String(formData.get("dataVencimento") ?? "");
  const categoria = String(formData.get("categoria") ?? "") || null;
  const clienteId = String(formData.get("clienteId") ?? "") || null;

  if (tipo !== "receita" && tipo !== "despesa") return { error: "Escolha se é entrada ou saída." };
  if (!descricao) return { error: "Descreva a movimentação." };
  if (!Number.isFinite(valor) || valor <= 0) return { error: "Informe um valor maior que zero." };
  if (!dataVencimento) return { error: "Informe a data de vencimento." };

  const supabase = await createClient();
  const { error } = await supabase.from("transacoes_financeiras").insert({
    tipo,
    descricao,
    valor,
    data_vencimento: dataVencimento,
    status: "pendente",
    categoria: tipo === "despesa" ? categoria : null,
    cliente_id: tipo === "receita" ? clienteId : null,
  });

  if (error) return { error: "Não foi possível lançar a movimentação." };

  revalidarFinanceiro();
  return {};
}

export async function marcarComoPago(transacaoId: string, metodo: string): Promise<TransacaoState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) return { error: "Consultores não podem dar baixa em movimentações." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transacoes_financeiras")
    .update({
      status: "pago",
      data_pagamento: new Date().toISOString(),
      metodo: metodo || null,
    })
    .eq("id", transacaoId);

  if (error) return { error: "Não foi possível dar baixa nesta movimentação." };

  revalidarFinanceiro();
  return {};
}

export async function cancelarTransacao(transacaoId: string): Promise<TransacaoState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) return { error: "Consultores não podem cancelar movimentações." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transacoes_financeiras")
    .update({ status: "cancelado" })
    .eq("id", transacaoId);

  if (error) return { error: "Não foi possível cancelar esta movimentação." };

  revalidarFinanceiro();
  return {};
}
