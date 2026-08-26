"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/auth/session";
import type { TipoPessoa } from "@/lib/types";

export interface CriarClienteState {
  error?: string;
}

export async function criarCliente(_prevState: CriarClienteState | undefined, formData: FormData): Promise<CriarClienteState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) {
    return { error: "Consultores não podem cadastrar clientes." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("clientes").insert({
    tipo_pessoa: formData.get("tipoPessoa") as TipoPessoa,
    nome: String(formData.get("nome") ?? ""),
    documento: String(formData.get("documento") ?? "").replace(/\D/g, ""),
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    endereco: {
      logradouro: String(formData.get("logradouro") ?? ""),
      numero: String(formData.get("numero") ?? ""),
      bairro: String(formData.get("bairro") ?? ""),
      cidade: String(formData.get("cidade") ?? ""),
      uf: String(formData.get("uf") ?? ""),
      cep: String(formData.get("cep") ?? ""),
    },
  });

  if (error) {
    return { error: error.message.includes("duplicate") ? "Já existe um cliente com esse documento." : "Não foi possível salvar o cliente." };
  }

  revalidatePath("/clientes");
  return {};
}
