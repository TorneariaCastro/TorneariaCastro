"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DecisaoOrcamentoState {
  error?: string;
}

export async function aprovarOrcamento(token: string): Promise<DecisaoOrcamentoState> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .update({ aprovado_em: new Date().toISOString() })
    .eq("token_compartilhamento", token)
    .is("aprovado_em", null)
    .is("recusado_em", null)
    .gt("link_expira_em", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "Não foi possível registrar a aprovação. O link pode ter expirado ou já ter sido respondido." };
  }

  revalidatePath(`/orcamento/${token}`);
  return {};
}

export async function recusarOrcamento(token: string): Promise<DecisaoOrcamentoState> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .update({ recusado_em: new Date().toISOString() })
    .eq("token_compartilhamento", token)
    .is("aprovado_em", null)
    .is("recusado_em", null)
    .gt("link_expira_em", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "Não foi possível registrar a recusa. O link pode ter expirado ou já ter sido respondido." };
  }

  revalidatePath(`/orcamento/${token}`);
  return {};
}
