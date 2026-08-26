export interface EmissaoNfseRequest {
  ordemServicoId: string;
  clienteDocumento: string;
  clienteNome: string;
  valorServico: number;
  discriminacaoServico: string;
  aliquotaIss: number;
}

export type StatusEmissaoNfse = "emitida" | "erro";

export interface EmissaoNfseResult {
  id: string;
  numero: string;
  codigoVerificacao: string;
  status: StatusEmissaoNfse;
  linkPdf: string;
  dataEmissao: string;
  valorIss: number;
  mensagemErro?: string;
}

export type StatusConsultaNfse = "processando" | "emitida" | "erro";

/**
 * Contrato para integração com o webservice de NFSe da prefeitura
 * (ex: ABRASF, Ginfes, ISS.net). A UI depende apenas desta interface —
 * a implementação real varia por município.
 */
export interface NfseService {
  emitir(req: EmissaoNfseRequest): Promise<EmissaoNfseResult>;
  consultarStatus(id: string): Promise<StatusConsultaNfse>;
  cancelar(id: string): Promise<{ cancelada: boolean }>;
}
