"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/auth/session";
import { nfseService } from "@/lib/services/nfse/mock-nfse-service";

export interface EmitirNfseInput {
  ordemServicoId: string;
  clienteNome: string;
  clienteDocumento: string;
  valorServico: number;
  discriminacaoServico: string;
  aliquotaIss: number;
}

export async function emitirNfse(input: EmitirNfseInput) {
  const { isAdmin } = await getSessao();
  if (!isAdmin) {
    throw new Error("Consultores não podem emitir notas fiscais.");
  }

  const supabase = await createClient();

  const resultado = await nfseService.emitir(input);

  const { data: existente } = await supabase
    .from("notas_fiscais")
    .select("id")
    .eq("ordem_servico_id", input.ordemServicoId)
    .maybeSingle();

  const payload = {
    ordem_servico_id: input.ordemServicoId,
    numero: resultado.numero,
    codigo_verificacao: resultado.codigoVerificacao,
    status: resultado.status,
    valor_servico: input.valorServico,
    aliquota_iss: input.aliquotaIss,
    valor_iss: resultado.valorIss,
    data_emissao: resultado.dataEmissao,
    link_pdf: resultado.linkPdf,
  };

  if (existente) {
    await supabase.from("notas_fiscais").update(payload).eq("id", existente.id);
  } else {
    await supabase.from("notas_fiscais").insert(payload);
  }

  revalidatePath("/notas-fiscais");
  revalidatePath("/financeiro");

  return resultado;
}
