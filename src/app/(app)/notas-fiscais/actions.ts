"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/auth/session";
import { sefinNacionalNfseService as nfseService } from "@/lib/services/nfse/sefin-nacional-nfse-service";

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

  // O documento do tomador é obrigatório na NFS-e e não pode vir da tela:
  // buscamos direto do cadastro, a partir da ordem de serviço.
  const { data: os } = await supabase
    .from("ordens_servico")
    .select("clientes(nome, documento)")
    .eq("id", input.ordemServicoId)
    .maybeSingle();

  const clienteDaOs = Array.isArray(os?.clientes) ? os?.clientes[0] : os?.clientes;
  const documento = String(clienteDaOs?.documento ?? "").replace(/\D/g, "");

  if (!documento) {
    throw new Error(
      "O cliente desta ordem de serviço está sem CPF/CNPJ cadastrado. " +
        "Complete o cadastro antes de emitir a nota fiscal.",
    );
  }

  // A alíquota do ISS não é enviada: BH pertence ao Sistema Nacional, então a
  // Receita aplica a alíquota parametrizada pela Prefeitura e devolve o ISS
  // apurado na nota autorizada. O valor abaixo é só referência interna.
  const resultado = await nfseService.emitir({
    ...input,
    clienteDocumento: documento,
    clienteNome: clienteDaOs?.nome ?? input.clienteNome,
  });

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
    // Só grava data de emissão se a nota foi de fato emitida.
    data_emissao: resultado.status === "emitida" ? resultado.dataEmissao : null,
    link_pdf: resultado.linkPdf,
    // Chave de acesso: é por ela que a nota é consultada e cancelada depois.
    chave_acesso: resultado.status === "emitida" ? resultado.id : null,
    mensagem_erro: resultado.mensagemErro ?? null,
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
