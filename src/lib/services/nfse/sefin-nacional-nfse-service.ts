import https from "node:https";
import zlib from "node:zlib";
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
 * Implementacao real do NfseService via o Sistema Nacional de NFS-e
 * (SEFIN Nacional / ADN - Ambiente de Dados Nacional), que SUBSTITUIU o
 * webservice proprio da Prefeitura de Belo Horizonte (BHISS Digital,
 * ver bhiss-nfse-service.ts) a partir de 1/1/2026 - migracao obrigatoria
 * confirmada na propria pagina da Prefeitura de BH e no portal gov.br/nfse.
 * O bhiss-nfse-service.ts foi mantido no repositorio por historico, mas
 * NAO deve mais ser usado para emissao real: o webservice antigo
 * (bhiss-ws) esta retornando 502 desde que essa migracao entrou em
 * vigor, o que bate com a hipotese de estar sendo desativado.
 *
 * ATUALIZACAO 2026-09-08 (mesma sessao, mais tarde): a estrutura interna
 * da tag <DPS>/<infDPS> abaixo foi REVALIDADA contra o layout OFICIAL,
 * baixado direto de gov.br/nfse (ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe-v1.01,
 * atualizado em 2026-02-09 - arquivo .xlsx, extraido via unzip+parse
 * porque a Swagger UI do site e uma SPA em JS que as ferramentas desta
 * sessao nao conseguem renderizar). Os nomes de tag/caminho abaixo
 * (prest, toma, serv/locPrest, serv/cServ, valores/vServPrest,
 * valores/trib/tribMun) sao AGORA confirmados campo a campo contra a
 * fonte oficial, nao mais uma aproximacao.
 *
 * Confirmado tambem pelo mesmo anexo: o grupo IBSCBS (Reforma
 * Tributaria) tem ocorrencia 0-1 (opcional) na DPS, e o proprio anexo
 * declara "Para optantes do Simples Nacional, os grupos IBSCBS so serao
 * obrigatorios a partir de 2027" - por isso NAO foi implementado (nao e
 * mais um TODO esquecido, e uma omissao deliberada, condicionada ao
 * regime tributario real da Tornearia Castro ser Simples Nacional -
 * ainda nao confirmado com o contador).
 *
 * O que CONTINUA sem confirmacao nesta sessao:
 * - Codigo de tributacao nacional do ISSQN (cTribNac, 6 digitos,
 *   LC 116/03) para os servicos da Tornearia Castro - variavel de
 *   ambiente obrigatoria, sem default (ver codigoTribNacObrigatorio()).
 * - Regime do Simples Nacional real da empresa (opSimpNac) - default
 *   conservador "nao optante", ajustavel por env var.
 * - A URL de PRODUCAO do SEFIN Nacional (emissao) foi apenas inferida
 *   por padrao (trocando o dominio de homologacao) - revalidar antes de
 *   trocar NFSE_NACIONAL_AMBIENTE para "producao".
 * - Formato exato do corpo aceito pelo endpoint POST /nfse (texto puro
 *   gzip+base64 vs. JSON com esse valor num campo) - inferido de relato
 *   tecnico de terceiro, nao de fonte oficial.
 * - Caminho exato dos campos de retorno (chave de acesso, numero) na
 *   resposta de sucesso.
 *
 * Outros fatos (transporte): documento fiscal agora se chama DPS (nao
 * mais RPS); corpo da requisicao e o XML da DPS assinado, comprimido em
 * GZip e codificado em Base64 (nao e mais SOAP puro como no BHISS);
 * autenticacao via certificado digital ICP-Brasil com mTLS (mesmo
 * .pfx/.pem do BHISS); emissao sincrona via POST {SEFIN_BASE}/nfse;
 * consulta por chave de acesso via GET {ADN_BASE}/NFSe/{chaveAcesso}.
 *
 * NAO EMITIR EM PRODUCAO sem: (1) confirmar cTribNac e o regime
 * tributario real com o contador, (2) testar de ponta a ponta em
 * homologacao, (3) confirmar a URL de producao do SEFIN Nacional.
 */

const AMBIENTE = process.env.NFSE_NACIONAL_AMBIENTE === "producao" ? "producao" : "homologacao";

// TODO(confirmar): URL de producao do SEFIN Nacional inferida por padrao,
// nao confirmada contra documentacao oficial nesta sessao.
const SEFIN_BASE_URL =
  AMBIENTE === "producao"
    ? "https://sefin.nfse.gov.br/SefinNacional"
    : "https://sefin.producaorestrita.nfse.gov.br/SefinNacional";

const ADN_BASE_URL =
  AMBIENTE === "producao"
    ? "https://adn.nfse.gov.br/contribuintes"
    : "https://adn.producaorestrita.nfse.gov.br/contribuintes";

const TP_AMBIENTE = AMBIENTE === "producao" ? "1" : "2"; // 1 = producao, 2 = homologacao (padrao nacional)
const CODIGO_MUNICIPIO_BH = "3106200";

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

function extrairCnpjDoCertificado(certificadoPem: string): string {
  const cert = forge.pki.certificateFromPem(certificadoPem);
  const cnField = cert.subject.getField("CN");
  const match = cnField?.value?.match(/(\d{14})/);
  if (!match) {
    throw new Error("Nao foi possivel extrair o CNPJ do certificado digital (campo CN inesperado).");
  }
  return match[1];
}

async function proximoNumeroDps(): Promise<number> {
  // Reaproveita a mesma sequencia usada para o RPS do BHISS - a numeracao
  // sequencial por serie/CNPJ e uma exigencia geral do layout nacional
  // tambem (nDPS), nao so do ABRASF municipal antigo.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("nextval_nfse_rps_sequencial");
  if (error) {
    throw new Error(`Falha ao obter proximo numero de DPS: ${error.message}`);
  }
  return Number(data);
}

function escaparXml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Situacao perante o Simples Nacional (prest/regTrib/opSimpNac):
// 1-Nao optante, 2-Optante MEI, 3-Optante ME/EPP. NAO sabemos o regime
// real da Tornearia Castro nesta sessao - confirmar com o contador antes
// de homologar. Default conservador: "1" (nao optante).
const OP_SIMPLES_NACIONAL = process.env.NFSE_BH_OP_SIMPLES_NACIONAL || "1";
// Regime Especial de Tributacao Municipal (prest/regTrib/regEspTrib):
// 0-Nenhum (default), 1-Ato Cooperado, 2-Estimativa, 3-ME Municipal,
// 4-Notario/Registrador, 5-Autonomo, 6-Sociedade de Profissionais, 9-Outros.
const REGIME_ESPECIAL_TRIBUTACAO = process.env.NFSE_BH_REGIME_ESPECIAL || "0";

// serv/cServ/cTribNac (obrigatorio, 1-1, 6 digitos): codigo de
// tributacao nacional do ISSQN conforme LC 116/03, listado na aba
// "MUN.INCID_INFO.SERV." do ANEXO_I oficial (nao lida nesta sessao) ou
// no ANEXO_B (Lista Nacional NBS2). Os servicos da Tornearia Castro
// (usinagem/torno CNC, solda de recomposicao, retifica, fresamento)
// provavelmente caem no grupo 14 - "Servicos relativos a bens de
// terceiros" (ex: 14.01 conserto/manutencao, 14.05
// restauracao/recondicionamento) - mas isso e uma hipotese, NAO uma
// confirmacao. Deliberadamente NAO tem default: emitir sem confirmar
// esse codigo classificaria o servico errado perante o fisco.
function codigoTribNacObrigatorio(): string {
  const valor = process.env.NFSE_BH_CODIGO_TRIB_NACIONAL;
  if (!valor) {
    throw new Error(
      "NFSE_BH_CODIGO_TRIB_NACIONAL nao configurada - confirmar o codigo de tributacao " +
        "nacional do ISSQN (6 digitos, LC 116/03) para os servicos da Tornearia Castro " +
        "antes de emitir. Ver ANEXO_B (Lista Nacional NBS2) em gov.br/nfse.",
    );
  }
  return valor;
}

function montarXmlDps(params: {
  numeroDps: number;
  serieDps: string;
  req: EmissaoNfseRequest;
  inscricaoMunicipal: string;
  cnpjPrestador: string;
}): string {
  const { numeroDps, serieDps, req, inscricaoMunicipal, cnpjPrestador } = params;
  const agora = new Date().toISOString();

  // Formato do Id confirmado no ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe-v1.01
  // (baixado de gov.br/nfse em 2026-09-08): "DPS" + Cod.Mun.(7) +
  // Tipo Inscricao Federal(1) + Inscricao Federal(14) + Serie(5) + Numero(15)
  // = 45 caracteres. Tipo de Inscricao Federal aqui e sempre "2" (CNPJ),
  // ja que o prestador (Tornearia Castro) e pessoa juridica.
  const idDps =
    `DPS${CODIGO_MUNICIPIO_BH}2${cnpjPrestador.padStart(14, "0")}` +
    `${serieDps.padStart(5, "0")}${String(numeroDps).padStart(15, "0")}`;

  const documentoTomadorLimpo = req.clienteDocumento.replace(/\D/g, "");
  const tagDocumentoTomador =
    documentoTomadorLimpo.length > 11
      ? `<CNPJ>${documentoTomadorLimpo}</CNPJ>`
      : `<CPF>${documentoTomadorLimpo}</CPF>`;

  // Estrutura confirmada campo a campo contra o ANEXO_I oficial (aba
  // "LEIAUTE DPS_NFS-e", caminho NFSe/infNFSe/DPS/infDPS/...) baixado de
  // gov.br/nfse em 2026-09-08 - substitui a aproximacao anterior.
  //
  // O grupo IBSCBS (DPS/infDPS/IBSCBS, ocorrencia 0-1) foi
  // deliberadamente OMITIDO: o proprio anexo oficial afirma "Para
  // optantes do Simples Nacional, os grupos IBSCBS so serao
  // obrigatorios a partir de 2027" - e a Tornearia Castro e uma empresa
  // pequena, provavelmente Simples Nacional (a confirmar com o
  // contador). Se ela NAO for optante do Simples, revisar isso antes de
  // homologar.
  return (
    `<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">` +
    `<infDPS Id="${idDps}">` +
    `<tpAmb>${TP_AMBIENTE}</tpAmb>` +
    `<dhEmi>${agora}</dhEmi>` +
    `<verAplic>1.0.0</verAplic>` +
    `<serie>${serieDps}</serie>` +
    `<nDPS>${numeroDps}</nDPS>` +
    `<dCompet>${agora.slice(0, 10)}</dCompet>` +
    `<tpEmit>1</tpEmit>` + // 1 = Prestador emite a propria DPS
    `<cLocEmi>${CODIGO_MUNICIPIO_BH}</cLocEmi>` +
    `<prest>` +
    `<CNPJ>${cnpjPrestador}</CNPJ>` +
    `<IM>${inscricaoMunicipal}</IM>` +
    `<regTrib>` +
    `<opSimpNac>${OP_SIMPLES_NACIONAL}</opSimpNac>` +
    `<regEspTrib>${REGIME_ESPECIAL_TRIBUTACAO}</regEspTrib>` +
    `</regTrib>` +
    `</prest>` +
    `<toma>${tagDocumentoTomador}<xNome>${escaparXml(req.clienteNome)}</xNome></toma>` +
    `<serv>` +
    `<locPrest><cLocPrestacao>${CODIGO_MUNICIPIO_BH}</cLocPrestacao></locPrest>` +
    `<cServ>` +
    `<cTribNac>${codigoTribNacObrigatorio()}</cTribNac>` +
    `<xDescServ>${escaparXml(req.discriminacaoServico)}</xDescServ>` +
    `</cServ>` +
    `</serv>` +
    `<valores>` +
    `<vServPrest><vServ>${req.valorServico.toFixed(2)}</vServ></vServPrest>` +
    `<trib><tribMun>` +
    `<tribISSQN>1</tribISSQN>` + // 1 = Operacao tributavel (caso padrao)
    `<tpRetISSQN>1</tpRetISSQN>` + // 1 = Nao retido
    `<pAliq>${req.aliquotaIss}</pAliq>` +
    `</tribMun></trib>` +
    `</valores>` +
    `</infDPS>` +
    `</DPS>`
  );
}

function assinarXml(xml: string, chavePrivadaPem: string, certificadoPem: string): string {
  const sig = new SignedXml({
    privateKey: chavePrivadaPem,
    publicCert: certificadoPem,
    signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
  });
  sig.addReference({
    xpath: "//*[local-name(.)='infDPS']",
    digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
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

function gzipBase64(xml: string): string {
  return zlib.gzipSync(Buffer.from(xml, "utf-8")).toString("base64");
}

function gunzipBase64(base64: string): string {
  return zlib.gunzipSync(Buffer.from(base64, "base64")).toString("utf-8");
}

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });

export class SefinNacionalNfseService implements NfseService {
  async emitir(req: EmissaoNfseRequest): Promise<EmissaoNfseResult> {
    const inscricaoMunicipal = process.env.NFSE_BH_INSCRICAO_MUNICIPAL;
    if (!inscricaoMunicipal) {
      throw new Error("NFSE_BH_INSCRICAO_MUNICIPAL nao configurada.");
    }

    const cert = carregarCertificado();
    const cnpjPrestador = extrairCnpjDoCertificado(cert.certificadoPem);
    const numeroDps = await proximoNumeroDps();
    const serieDps = "1";

    const xmlDps = montarXmlDps({
      numeroDps,
      serieDps,
      req,
      inscricaoMunicipal,
      cnpjPrestador,
    });
    const xmlAssinado = assinarXml(xmlDps, cert.chavePrivadaPem, cert.certificadoPem);
    const payloadGzipBase64 = gzipBase64(xmlAssinado);

    try {
      // TODO(validar contra documentacao oficial - Swagger nao acessivel
      // nesta sessao): confirmar se o corpo esperado e texto puro
      // (gzip+base64 direto) ou um JSON com o campo contendo esse valor.
      const response = await fetch(`${SEFIN_BASE_URL}/nfse`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: payloadGzipBase64,
        // @ts-expect-error -- agente https customizado (mTLS) nao faz parte do tipo padrao do fetch
        agent: agenteMtls(cert),
      });

      const textoResposta = await response.text();
      if (!response.ok) {
        throw new Error(
          `SEFIN Nacional retornou HTTP ${response.status}: ${textoResposta.slice(0, 500)}`,
        );
      }

      return interpretarRespostaEmissao(textoResposta, req, numeroDps, serieDps);
    } catch (erro) {
      return {
        id: `dps_${serieDps}_${numeroDps}`,
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
    // Confirmado (fonte: relato tecnico cruzado com pagina oficial):
    // consulta por chave de acesso e GET, nao POST/SOAP como no BHISS.
    // TODO(validar): o "id" salvo em notas_fiscais hoje e o numero do
    // RPS/DPS, nao a chave de acesso de 50 caracteres retornada pela
    // NFSe - precisa persistir a chave de acesso real na emissao para
    // essa consulta funcionar.
    const response = await fetch(`${ADN_BASE_URL}/NFSe/${id}`, {
      method: "GET",
      // @ts-expect-error -- agente https customizado (mTLS) nao faz parte do tipo padrao do fetch
      agent: agenteMtls(cert),
    });

    if (response.status === 404) return "processando";
    if (!response.ok) return "erro";

    const corpo = await response.text();
    try {
      const xml = gunzipBase64(corpo);
      const parsed = parser.parse(xml);
      const temErro = JSON.stringify(parsed).includes("Rejeicao");
      return temErro ? "erro" : "emitida";
    } catch {
      return "erro";
    }
  }

  async cancelar(id: string): Promise<{ cancelada: boolean }> {
    const cert = carregarCertificado();
    // TODO(validar contra documentacao oficial): estrutura exata do
    // evento de cancelamento (payload, se tambem precisa ser assinado e
    // comprimido como a DPS) nao foi confirmada nesta sessao.
    const response = await fetch(`${ADN_BASE_URL}/NFSe/${id}/Eventos`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: gzipBase64(`<pedRegEvento xmlns="http://www.sped.fazenda.gov.br/nfse"><Cancelamento/></pedRegEvento>`),
      // @ts-expect-error -- agente https customizado (mTLS) nao faz parte do tipo padrao do fetch
      agent: agenteMtls(cert),
    });
    return { cancelada: response.ok };
  }
}

function interpretarRespostaEmissao(
  respostaTexto: string,
  req: EmissaoNfseRequest,
  numeroDps: number,
  serieDps: string,
): EmissaoNfseResult {
  const valorIss = Number((req.valorServico * req.aliquotaIss).toFixed(2));

  let xmlResposta: string;
  try {
    xmlResposta = gunzipBase64(respostaTexto.trim());
  } catch {
    // Resposta pode nao vir comprimida em caso de erro (mensagem de texto puro).
    xmlResposta = respostaTexto;
  }

  const parsed = parser.parse(xmlResposta);
  const bruto = JSON.stringify(parsed);

  if (bruto.includes("Rejeicao") || bruto.includes("erro")) {
    return {
      id: `dps_${serieDps}_${numeroDps}`,
      numero: "",
      codigoVerificacao: "",
      status: "erro",
      linkPdf: "",
      dataEmissao: new Date().toISOString(),
      valorIss,
      mensagemErro: `SEFIN Nacional rejeitou a emissao. Resposta bruta: ${xmlResposta.slice(0, 1000)}`,
    };
  }

  // TODO(validar contra XSD oficial): caminho exato dos campos
  // chaveAcesso/numero/codigoVerificacao dentro da NFSe retornada.
  return {
    id: `dps_${serieDps}_${numeroDps}`,
    numero: String(numeroDps),
    codigoVerificacao: "",
    status: "emitida",
    linkPdf: "",
    dataEmissao: new Date().toISOString(),
    valorIss,
  };
}

export const sefinNacionalNfseService: NfseService = new SefinNacionalNfseService();
