export type TipoTransacao = "receita" | "despesa";

export type StatusTransacao = "pendente" | "pago" | "atrasado" | "cancelado";

export type CategoriaDespesa =
  | "materia_prima"
  | "ferramentas_corte"
  | "energia"
  | "manutencao"
  | "salarios"
  | "impostos"
  | "outros";

export type MetodoRecebimento =
  | "boleto"
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "transferencia"
  | "dinheiro";

export const LABEL_CATEGORIA_DESPESA: Record<CategoriaDespesa, string> = {
  materia_prima: "Matéria-prima",
  ferramentas_corte: "Ferramentas de Corte",
  energia: "Energia",
  manutencao: "Manutenção",
  salarios: "Salários",
  impostos: "Impostos",
  outros: "Outros",
};

export interface TransacaoFinanceira {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  categoria?: CategoriaDespesa;
  clienteId?: string;
  clienteNome?: string;
  ordemServicoId?: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusTransacao;
  metodo?: MetodoRecebimento;
}
