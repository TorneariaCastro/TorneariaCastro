import type {
  BoletoRequest,
  BoletoResult,
  LinkPagamentoRequest,
  LinkPagamentoResult,
  PaymentGateway,
  StatusCobranca,
} from "./types";

function atraso(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function gerarId(prefixo: string) {
  return `${prefixo}_${Math.random().toString(36).slice(2, 10)}`;
}

function gerarLinhaDigitavel() {
  const blocos = Array.from({ length: 5 }, () =>
    Math.floor(10000 + Math.random() * 89999).toString(),
  );
  return blocos.join(".");
}

/**
 * Implementação mockada de PaymentGateway. Simula latência de rede e
 * retorna dados fake plausíveis. Troque por um adapter real (Asaas,
 * Pagar.me, Stripe) implementando a mesma interface — a UI não muda.
 */
export class MockPaymentGateway implements PaymentGateway {
  async gerarBoleto(req: BoletoRequest): Promise<BoletoResult> {
    await atraso(600);
    const id = gerarId("bol");
    return {
      id,
      linhaDigitavel: gerarLinhaDigitavel(),
      codigoBarras: Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join(""),
      urlPdf: `https://mock-gateway.local/boletos/${id}.pdf`,
      status: "gerado",
    };
  }

  async gerarLinkPagamento(req: LinkPagamentoRequest): Promise<LinkPagamentoResult> {
    await atraso(500);
    const id = gerarId("link");
    const expiraEm = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();
    return {
      id,
      url: `https://mock-gateway.local/pay/${id}`,
      status: "ativo",
      expiraEm,
    };
  }

  async consultarStatusCobranca(id: string): Promise<StatusCobranca> {
    await atraso(300);
    return "pendente";
  }
}

export const paymentGateway: PaymentGateway = new MockPaymentGateway();
