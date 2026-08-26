export type StatusOrdemServico =
  | "rascunho"
  | "orcado"
  | "em_execucao"
  | "pronto"
  | "faturado"
  | "cancelado";

export const PIPELINE_ORDEM_SERVICO: StatusOrdemServico[] = [
  "rascunho",
  "orcado",
  "em_execucao",
  "pronto",
  "faturado",
];

export interface ItemMaoDeObra {
  id: string;
  descricao: string;
  horas: number;
  valorHora: number;
}

export interface ItemMaterial {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
}

export interface OrdemServico {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  status: StatusOrdemServico;
  descricaoServico: string;
  maoDeObra: ItemMaoDeObra[];
  materiais: ItemMaterial[];
  dataAbertura: string;
  previsaoEntrega?: string;
  dataConclusao?: string;
  observacoes?: string;
}

export function calcularValorMaoDeObra(os: Pick<OrdemServico, "maoDeObra">): number {
  return os.maoDeObra.reduce((total, item) => total + item.horas * item.valorHora, 0);
}

export function calcularValorMateriais(os: Pick<OrdemServico, "materiais">): number {
  return os.materiais.reduce((total, item) => total + item.quantidade * item.valorUnitario, 0);
}

export function calcularValorTotal(os: Pick<OrdemServico, "maoDeObra" | "materiais">): number {
  return calcularValorMaoDeObra(os) + calcularValorMateriais(os);
}
