# Integração NFS-e — Belo Horizonte (Sistema Nacional NFS-e / SEFIN Nacional)

## ⚠️ ATUALIZAÇÃO CRÍTICA (2026-09-08) — BHISS Digital não é mais o alvo certo
A decisão original abaixo (2026-09-07) mirava o webservice próprio da Prefeitura de BH (BHISS Digital, `bhiss-ws`). Um dia depois, o Hades descobriu — pesquisando por que o webservice respondia 502 — que **desde 1º de janeiro de 2026 a emissão de NFS-e em BH é obrigatória pelo Emissor Nacional (SEFIN Nacional / ADN)**, sistema federal que substituiu o BHISS Digital. Fonte: página oficial da própria Prefeitura de BH (`prefeitura.pbh.gov.br/noticias/belo-horizonte-adere-ao-emissor-nacional-de-nota-fiscal-de-servico-eletronica`) e portal `gov.br/nfse`. O 502 provavelmente é o webservice antigo sendo desativado, não instabilidade passageira.

**O que muda na prática:**
- O documento fiscal se chama **DPS** (Declaração de Prestação de Serviço), não mais RPS
- O endpoint, formato de envio (XML assinado, comprimido em GZip e codificado em Base64) e as URLs mudaram — ver `src/lib/services/nfse/sefin-nacional-nfse-service.ts`
- Desde agosto/2026, a Reforma Tributária exige campos de **IBS/CBS** na nota (ainda não implementados no código — TODO explícito)
- O certificado digital e-CNPJ da Tornearia Castro continua sendo o mesmo — isso não muda

A implementação antiga (`bhiss-nfse-service.ts`, mirando BHISS Digital direto) foi **mantida no repositório por histórico, mas não é mais o caminho ativo**. Decisão original preservada abaixo para contexto.

---

## Decisão original (validada com Kleber em 2026-09-07) — SUPERADA, ver aviso acima
Integração **direta** com o webservice da Prefeitura de Belo Horizonte (BHISS Digital), sem provedor intermediário (Focus NFe, NFE.io, etc). Sem custo recorrente de terceiro — em troca, o Atlas constrói e mantém a comunicação SOAP/XML e a assinatura digital por conta própria.

**Alerta da Shiva pro Kleber:** esse caminho é mais trabalhoso de construir do que um provedor pronto — o Hades precisa tratar isso como tarefa não-trivial (assinatura XMLDSig, webservice SOAP legado, tratamento de erro do lado da Prefeitura). Se em algum momento o esforço não compensar, dá pra trocar de estratégia depois — a interface `NfseService` já foi desenhada exatamente pra isso (trocar a implementação sem mexer na UI).

**Nota (2026-09-08):** essa mesma flexibilidade da interface `NfseService` é o que permitiu trocar de BHISS Digital pro Emissor Nacional sem tocar na UI nem no banco — decisão original da Shiva se provou correta mesmo com a mudança de alvo.

## Pré-requisitos confirmados
- ✅ Certificado digital e-CNPJ (A1, arquivo `.pfx`) — Tornearia Castro já possui
- ✅ Cadastro ativo como contribuinte do ISS em BH, com acesso ao portal BHISS Digital

## Pré-requisitos ainda pendentes de dado concreto
- [ ] **Inscrição Municipal** da Tornearia Castro em BH (número exato — Kleber confirma antes do Atlas codificar o XML)
- [ ] **Arquivo `.pfx` do certificado + senha** — Kleber fornece quando o Atlas for implementar. Protocolo de credencial (não pular):
  - NUNCA colar o certificado ou a senha no chat como texto solto sem necessidade, nem commitar no repositório
  - Armazenar o `.pfx` como segredo (base64) fora do código-fonte — variável de ambiente server-side (`.env.local`, nunca `NEXT_PUBLIC_*`) ou Supabase Storage privado com acesso só por `service_role`
  - Assinatura do XML acontece **apenas server-side** (Server Action / Route Handler) — o certificado nunca chega ao navegador
- [ ] **Código do município (IBGE)** de Belo Horizonte para o XML: `3106200` (Hades/Atlas confirmam contra a documentação oficial do BHISS Digital antes de codificar — não presumir)

## Ambientes
Dois estágios, na ordem:
1. **Homologação** — ambiente de teste do BHISS Digital. Notas emitidas aqui não têm valor fiscal real. Usado para validar o fluxo completo (emissão, consulta, cancelamento) sem risco.
2. **Produção** — só depois que homologação estiver 100% validada por Kleber.

A implementação deve ler a URL do webservice (homologação vs produção) de uma variável de ambiente, nunca hardcoded — facilita alternar sem redeploy de código.

## Gatilho de emissão (já definido em `projeto.md`)
Emissão acontece por transação financeira marcada como **paga**, na tela Financeiro — não é um botão solto em Ordens de Serviço.

## Contrato já existente (não muda)
`src/lib/services/nfse/types.ts` já define `NfseService` (`emitir`, `consultarStatus`, `cancelar`) e o schema `notas_fiscais` já está no plano de migration (`plano-tarefas.md`). A UI e o banco não mudam — só a implementação por trás da interface, que agora é `SefinNacionalNfseService` (`src/lib/services/nfse/sefin-nacional-nfse-service.ts`), substituindo `MockNfseService`.

## Critério de Aceitação (pra Hades formalizar no plano técnico)
- Emissão de NFS-e de teste em homologação (SEFIN Nacional) funciona de ponta a ponta (transação paga → DPS assinada → envio → NFS-e emitida → status refletido em `notas_fiscais`)
- Erro do webservice nacional é capturado e mostrado de forma legível (não é um crash silencioso)
- Cancelamento de nota funciona
- Campos de IBS/CBS confirmados e implementados (exigência desde agosto/2026)
- Só depois disso, Kleber aprova a troca pra produção
