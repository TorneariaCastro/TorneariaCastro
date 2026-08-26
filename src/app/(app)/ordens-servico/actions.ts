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
