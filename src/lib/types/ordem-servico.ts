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

/** Preço fechado: o que o cliente compra, sem abrir horas nem custo de material. */
export interface ItemServico {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

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
  servicos: ItemServico[];
  maoDeObra: ItemMaoDeObra[];
  materiais: ItemMaterial[];
  dataAbertura: string;
  previsaoEntrega?: string;
  dataConclusao?: string;
  observacoes?: string;
  tokenCompartilhamento: string;
  aprovadoEm?: string;
  recusadoEm?: string;
  linkExpiraEm?: string;
}

export function calcularValorServicos(os: Pick<OrdemServico, "servicos">): number {
  return os.servicos.reduce((total, item) => total + item.quantidade * item.valorUnitario, 0);
}

export function calcularValorMaoDeObra(os: Pick<OrdemServico, "maoDeObra">): number {
  return os.maoDeObra.reduce((total, item) => total + item.horas * item.valorHora, 0);
}

export function calcularValorMateriais(os: Pick<OrdemServico, "materiais">): number {
  return os.materiais.reduce((total, item) => total + item.quantidade * item.valorUnitario, 0);
}

export function calcularValorTotal(
  os: Pick<OrdemServico, "servicos" | "maoDeObra" | "materiais">,
): number {
  return calcularValorServicos(os) + calcularValorMaoDeObra(os) + calcularValorMateriais(os);
}
