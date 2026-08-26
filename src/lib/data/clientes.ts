import { createClient } from "@/lib/supabase/server";
import type { Cliente, Endereco, TipoPessoa } from "@/lib/types";

interface ClienteRow {
  id: string;
  tipo_pessoa: TipoPessoa;
  nome: string;
  documento: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  email: string;
  telefone: string;
  endereco: Endereco;
  ativo: boolean;
  criado_em: string;
  observacoes: string | null;
}

function toCliente(row: ClienteRow): Cliente {
  return {
    id: row.id,
    tipoPessoa: row.tipo_pessoa,
    nome: row.nome,
    documento: row.documento,
    inscricaoEstadual: row.inscricao_estadual ?? undefined,
    inscricaoMunicipal: row.inscricao_municipal ?? undefined,
    email: row.email,
    telefone: row.telefone,
    endereco: row.endereco,
    ativo: row.ativo,
    criadoEm: row.criado_em,
    observacoes: row.observacoes ?? undefined,
  };
}

export async function listClientes(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clientes").select("*").order("nome");
  if (error) throw error;
  return (data as ClienteRow[]).map(toCliente);
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toCliente(data as ClienteRow) : null;
}
