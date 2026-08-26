import type {
  EmissaoNfseRequest,
  EmissaoNfseResult,
  NfseService,
  StatusConsultaNfse,
} from "./types";

function atraso(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function gerarNumero() {
  const ano = new Date().getFullYear();
  const sequencial = Math.floor(1000 + Math.random() * 8999);
  return `${ano}${sequencial}`;
}

function gerarCodigoVerificacao() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

/**
 * Implementação mockada de NfseService. Simula a emissão de NFSe
 * municipal com latência e retorno plausível. Troque por um adapter
 * real (integração com a prefeitura via provedor tipo NFE.io, Focus NFe)
 * implementando a mesma interface.
 */
export class MockNfseService implements NfseService {
  async emitir(req: EmissaoNfseRequest): Promise<EmissaoNfseResult> {
    await atraso(900);
    const id = `nfse_${Math.random().toString(36).slice(2, 10)}`;
    const valorIss = Number((req.valorServico * req.aliquotaIss).toFixed(2));
    return {
      id,
      numero: gerarNumero(),
      codigoVerificacao: gerarCodigoVerificacao(),
      status: "emitida",
      linkPdf: `https://mock-prefeitura.local/nfse/${id}.pdf`,
      dataEmissao: new Date().toISOString(),
      valorIss,
    };
  }

  async consultarStatus(id: string): Promise<StatusConsultaNfse> {
    await atraso(300);
    return "emitida";
  }

  async cancelar(id: string): Promise<{ cancelada: boolean }> {
    await atraso(400);
    return { cancelada: true };
  }
}

export const nfseService: NfseService = new MockNfseService();
