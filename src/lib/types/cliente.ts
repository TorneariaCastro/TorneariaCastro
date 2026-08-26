export type TipoPessoa = "fisica" | "juridica";

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface Cliente {
  id: string;
  tipoPessoa: TipoPessoa;
  /** Razão Social (jurídica) ou Nome completo (física) */
  nome: string;
  /** CNPJ ou CPF, apenas dígitos */
  documento: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  email: string;
  telefone: string;
  endereco: Endereco;
  ativo: boolean;
  criadoEm: string;
  observacoes?: string;
}

export interface ClienteResumoFinanceiro {
  clienteId: string;
  totalFaturado: number;
  faturasPendentes: number;
  faturasAtrasadas: number;
  totalOrdensServico: number;
}
