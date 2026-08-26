export interface BoletoRequest {
  transacaoId: string;
  valor: number;
  vencimento: string;
  pagador: {
    nome: string;
    documento: string;
  };
  descricao: string;
}

export interface BoletoResult {
  id: string;
  linhaDigitavel: string;
  codigoBarras: string;
  urlPdf: string;
  status: "gerado" | "erro";
  mensagemErro?: string;
}

export type MetodoLinkPagamento = "cartao_credito" | "cartao_debito" | "pix";

export interface LinkPagamentoRequest {
  transacaoId: string;
  valor: number;
  descricao: string;
  metodosAceitos: MetodoLinkPagamento[];
}

export interface LinkPagamentoResult {
  id: string;
  url: string;
  status: "ativo" | "erro";
  expiraEm: string;
  mensagemErro?: string;
}

export type StatusCobranca = "pendente" | "pago" | "cancelado";

/**
 * Contrato que qualquer gateway de pagamento real (Stripe, Asaas, Pagar.me...)
 * deve implementar. A UI depende apenas desta interface.
 */
export interface PaymentGateway {
  gerarBoleto(req: BoletoRequest): Promise<BoletoResult>;
  gerarLinkPagamento(req: LinkPagamentoRequest): Promise<LinkPagamentoResult>;
  consultarStatusCobranca(id: string): Promise<StatusCobranca>;
}
