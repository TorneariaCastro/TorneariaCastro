export type StatusNfse = "nao_emitida" | "processando" | "emitida" | "erro" | "cancelada";

export interface NotaFiscal {
  id: string;
  ordemServicoId: string;
  numero?: string;
  codigoVerificacao?: string;
  status: StatusNfse;
  valorServico: number;
  aliquotaIss: number;
  valorIss: number;
  dataEmissao?: string;
  linkPdf?: string;
  mensagemErro?: string;
}
