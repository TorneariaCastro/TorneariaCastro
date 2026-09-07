import https from "node:https";
import forge from "node-forge";
import { XMLParser } from "fast-xml-parser";
import { SignedXml } from "xml-crypto";
import { createClient } from "@/lib/supabase/server";
import type {
  EmissaoNfseRequest,
  EmissaoNfseResult,
  NfseService,
  StatusConsultaNfse,
} from "./types";

/**
 * Implementacao real do NfseService para o webservice BHISS Digital
 * (Prefeitura de Belo Horizonte), layout ABRASF.
 *
 * ATENCAO: a estrutura exata do envelope SOAP e dos campos do RPS abaixo
 * segue o padrao ABRASF geral. O manual oficial de BH nao pode ser
 * confirmado nesta sessao porque bhissdigital.pbh.gov.br respondeu 502
 * em toda tentativa de acesso (portal, PDF do manual, WSDL). Kleber
 * autorizou seguir com o padrao ABRASF conhecido enquanto o site nao
 * volta. NAO EMITIR EM PRODUCAO sem antes validar em homologacao
 * (Passo 7 do plano) e sem revalidar este arquivo contra o manual/XSD
 * reais assim que o site da Prefeitura voltar ao ar.
 */

const RPS_TIPO_RPS = "1"; // ABRASF: 1 = RPS comum
const RPS_STATUS_NORMAL = "1"; // ABRASF: 1 = normal

interface CertificadoCarregado {
  chavePrivadaPem: string;
  certificadoPem: string;
  pfxBuffer: Buffer;
  senha: string;
}

function carregarCertificado(): CertificadoCarregado {
  const pfxBase64 = process.env.NFSE_BH_CERTIFICADO_PFX_BASE64;
  const senha = process.env.NFSE_BH_CERTIFICADO_SENHA;
  if (!pfxBase64 || !senha) {
    throw new Error(
      "Certificado NFS-e nao configurado (NFSE_BH_CERTIFICADO_PFX_BASE64 / NFSE_BH_CERTIFICADO_SENHA ausentes).",
    );
  }

  const pfxBuffer = Buffer.from(pfxBase64, "base64");
  const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });

  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  const certBag = certBags[forge.pki.oids.certBag]?.[0];

  if (!keyBag?.key || !certBag?.cert) {
    throw new Error("Nao foi possivel extrair chave privada/certificado do .pfx fornecido.");
  }

  const chavePrivadaPem = forge.pki.privateKeyToPem(keyBag.key);
  const certificadoPem = forge.pki.certificateToPem(certBag.cert);

  return { chavePrivadaPem, certificadoPem, pfxBuffer, senha };
}

async function proximoNumeroRps(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("nextval_nfse_rps_sequencial");
  if (error) {
    throw new Error(`Falha ao obter proximo numero de RPS: ${error.message}`);
  }
  return Number(data);
}

function montarXmlRps(params: {
  numeroRps: number;
  serieRps: string;
  req: EmissaoNfseRequest;
  inscricaoMunicipal: string;
  cnpjPrestador: string;
}): string {
  const { numeroRps, serieRps, req, inscricaoMunicipal, cnpjPrestador } = params;
  const agora = new Date().toISOString();
  const valorIss = Number((req.valorServico * req.aliquotaIss).toFixed(2));
  const documentoTomadorLimpo = req.clienteDocumento.replace(/\D/g, "");
  const tagDocumentoTomador =
    documentoTomadorLimpo.length > 11
      ? `<Cnpj>${documentoTomadorLimpo}</Cnpj>`
      : `<Cpf>${documentoTomadorLimpo}</Cpf>`;

  // TODO(validar contra XSD oficial de BH): nomes/ordem de tags, codigo de
  // municipio (IBGE 3106200), item de lista de servico e codigo CNAE devem
  // ser confirmados quando o manual estiver acessivel novamente.
  return (
    `<Rps xmlns="http://www.abrasf.org.br/nfse.xsd">` +
    `<InfDeclaracaoPrestacaoServico Id="RPS${serieRps}${numeroRps}">` +
    `<Rps>` +
    `<IdentificacaoRps><Numero>${numeroRps}</Numero><Serie>${serieRps}</Serie><Tipo>${RPS_TIPO_RPS}</Tipo></IdentificacaoRps>` +
    `<DataEmissao>${agora}</DataEmissao>` +
    `<Status>${RPS_STATUS_NORMAL}</Status>` +
    `</Rps>` +
    `<Competencia>${agora}</Competencia>` +
    `<Servico>` +
    `<Valores>` +
    `<ValorServicos>${req.valorServico.toFixed(2)}</ValorServicos>` +
    `<ValorIss>${valorIss.toFixed(2)}</ValorIss>` +
    `<Aliquota>${req.aliquotaIss}</Aliquota>` +
    `</Valores>` +
    `<IssRetido>2</IssRetido>` +
    `<Discriminacao>${escaparXml(req.discriminacaoServico)}</Discriminacao>` +
    `<CodigoMunicipio>3106200</CodigoMunicipio>` +
    `</Servico>` +
    `<Prestador><CpfCnpj><Cnpj>${cnpjPrestador}</Cnpj></CpfCnpj><InscricaoMunicipal>${inscricaoMunicipal}</InscricaoMunicipal></Prestador>` +
    `<Tomador><IdentificacaoTomador><CpfCnpj>${tagDocumentoTomador}</CpfCnpj></IdentificacaoTomador><RazaoSocial>${escaparXml(req.clienteNome)}</RazaoSocial></Tomador>` +
    `<OptanteSimplesNacional>2</OptanteSimplesNacional>` +
    `</InfDeclaracaoPrestacaoServico>` +
    `</Rps>`
  );
}

function escaparXml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function assinarXml(xml: string, chavePrivadaPem: string, certificadoPem: string): string {
  const sig = new SignedXml({
    privateKey: chavePrivadaPem,
    publicCert: certificadoPem,
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
  });
  sig.addReference({
    xpath: "//*[local-name(.)='InfDeclaracaoPrestacaoServico']",
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
  });
  sig.computeSignature(xml);
  return sig.getSignedXml();
}

function agenteMtls(cert: CertificadoCarregado): https.Agent {
  return new https.Agent({
    pfx: cert.pfxBuffer,
    passphrase: cert.senha,
  });
}

async function enviarSoap(params: {
  operacao: "GerarNfse" | "ConsultarNfse" | "CancelarNfse";
  xmlPayload: string;
  cert: CertificadoCarregado;
}): Promise<string> {
  const wsdlUrl = process.env.NFSE_BH_WSDL_URL;
  if (!wsdlUrl) {
    throw new Error("NFSE_BH_WSDL_URL nao configurada.");
  }
  const endpoint = wsdlUrl.replace(/\?wsdl$/i, "");

  // TODO(validar contra WSDL real de BH): nome do elemento raiz da operacao
  // SOAP e do wrapper de dados (padrao ABRASF costuma usar
  // nfseCabecMsg/nfseDadosMsg) precisam bater com o WSDL vigente.
  const envelope =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.bhiss.pbh.gov.br">` +
    `<soapenv:Body><ws:${params.operacao}Request>` +
    `<![CDATA[${params.xmlPayload}]]>` +
    `</ws:${params.operacao}Request></soapenv:Body></soapenv:Envelope>`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: params.operacao,
    },
    body: envelope,
    // @ts-expect-error -- agente https customizado (mTLS) nao faz parte do tipo padrao do fetch
    agent: agenteMtls(params.cert),
  });

  const texto = await response.text();
  if (!response.ok) {
    throw new Error(`Webservice BHISS retornou HTTP ${response.status}: ${texto.slice(0, 500)}`);
  }
  return texto;
}

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });

export class BhissNfseService implements NfseService {
  async emitir(req: EmissaoNfseRequest): Promise<EmissaoNfseResult> {
    const inscricaoMunicipal = process.env.NFSE_BH_INSCRICAO_MUNICIPAL;
    if (!inscricaoMunicipal) {
      throw new Error("NFSE_BH_INSCRICAO_MUNICIPAL nao configurada.");
    }

    const cert = carregarCertificado();
    const cnpjPrestador = extrairCnpjDoCertificado(cert.certificadoPem);
    const numeroRps = await proximoNumeroRps();
    const serieRps = "1";

    const xmlRps = montarXmlRps({
      numeroRps,
      serieRps,
      req,
      inscricaoMunicipal,
      cnpjPrestador,
    });
    const xmlAssinado = assinarXml(xmlRps, cert.chavePrivadaPem, cert.certificadoPem);

    try {
      const respostaXml = await enviarSoap({
        operacao: "GerarNfse",
        xmlPayload: xmlAssinado,
        cert,
      });
      return interpretarRespostaEmissao(respostaXml, req, numeroRps, serieRps);
    } catch (erro) {
      return {
        id: `rps_${serieRps}_${numeroRps}`,
        numero: "",
        codigoVerificacao: "",
        status: "erro",
        linkPdf: "",
        dataEmissao: new Date().toISOString(),
        valorIss: Number((req.valorServico * req.aliquotaIss).toFixed(2)),
        mensagemErro: erro instanceof Error ? erro.message : "Erro desconhecido ao emitir NFS-e.",
      };
    }
  }

  async consultarStatus(id: string): Promise<StatusConsultaNfse> {
    const cert = carregarCertificado();
    const inscricaoMunicipal = process.env.NFSE_BH_INSCRICAO_MUNICIPAL;
    if (!inscricaoMunicipal) {
      throw new Error("NFSE_BH_INSCRICAO_MUNICIPAL nao configurada.");
    }
    // TODO(validar contra manual de BH): payload exato de ConsultarNfse por RPS.
    const xmlConsulta =
      `<ConsultarNfseRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">` +
      `<IdentificacaoRps><Numero>${id}</Numero></IdentificacaoRps>` +
      `<Prestador><InscricaoMunicipal>${inscricaoMunicipal}</InscricaoMunicipal></Prestador>` +
      `</ConsultarNfseRpsEnvio>`;
    const respostaXml = await enviarSoap({ operacao: "ConsultarNfse", xmlPayload: xmlConsulta, cert });
    const parsed = parser.parse(respostaXml);
    const temErro = JSON.stringify(parsed).includes("ListaMensagemRetorno");
    if (temErro) return "erro";
    return "emitida";
  }

  async cancelar(id: string): Promise<{ cancelada: boolean }> {
    const cert = carregarCertificado();
    // TODO(validar contra manual de BH): payload exato de CancelarNfse.
    const xmlCancelamento =
      `<CancelarNfseEnvio xmlns="http://www.abrasf.org.br/nfse.xsd"><Pedido><InfPedidoCancelamento><IdentificacaoNfse><Numero>${id}</Numero></IdentificacaoNfse></InfPedidoCancelamento></Pedido></CancelarNfseEnvio>`;
    const respostaXml = await enviarSoap({ operacao: "CancelarNfse", xmlPayload: xmlCancelamento, cert });
    return { cancelada: respostaXml.includes("Cancelado") };
  }
}

function extrairCnpjDoCertificado(certificadoPem: string): string {
  const cert = forge.pki.certificateFromPem(certificadoPem);
  const cnField = cert.subject.getField("CN");
  const match = cnField?.value?.match(/(\d{14})/);
  if (!match) {
    throw new Error("Nao foi possivel extrair o CNPJ do certificado digital (campo CN inesperado).");
  }
  return match[1];
}

function interpretarRespostaEmissao(
  respostaXml: string,
  req: EmissaoNfseRequest,
  numeroRps: number,
  serieRps: string,
): EmissaoNfseResult {
  const parsed = parser.parse(respostaXml);
  const bruto = JSON.stringify(parsed);
  const valorIss = Number((req.valorServico * req.aliquotaIss).toFixed(2));

  if (bruto.includes("ListaMensagemRetorno") || bruto.includes("Fault")) {
    return {
      id: `rps_${serieRps}_${numeroRps}`,
      numero: "",
      codigoVerificacao: "",
      status: "erro",
      linkPdf: "",
      dataEmissao: new Date().toISOString(),
      valorIss,
      mensagemErro: `Webservice BHISS rejeitou a emissao. Resposta bruta: ${respostaXml.slice(0, 1000)}`,
    };
  }

  // TODO(validar contra manual de BH): caminho exato dos campos Numero/
  // CodigoVerificacao dentro de CompNfse na resposta de sucesso.
  return {
    id: `rps_${serieRps}_${numeroRps}`,
    numero: String(numeroRps),
    codigoVerificacao: "",
    status: "emitida",
    linkPdf: "",
    dataEmissao: new Date().toISOString(),
    valorIss,
  };
}

export const bhissNfseService: NfseService = new BhissNfseService();
