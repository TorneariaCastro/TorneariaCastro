# Integração NFS-e — Prefeitura de Belo Horizonte (BHISS Digital)

## Decisão (validada com Kleber em 2026-09-07)
Integração **direta** com o webservice da Prefeitura de Belo Horizonte (BHISS Digital), sem provedor intermediário (Focus NFe, NFE.io, etc). Sem custo recorrente de terceiro — em troca, o Atlas constrói e mantém a comunicação SOAP/XML e a assinatura digital por conta própria.

**Alerta da Shiva pro Kleber:** esse caminho é mais trabalhoso de construir do que um provedor pronto — o Hades precisa tratar isso como tarefa não-trivial (assinatura XMLDSig, webservice SOAP legado, tratamento de erro do lado da Prefeitura). Se em algum momento o esforço não compensar, dá pra trocar de estratégia depois — a interface `NfseService` já foi desenhada exatamente pra isso (trocar a implementação sem mexer na UI).

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
`src/lib/services/nfse/types.ts` já define `NfseService` (`emitir`, `consultarStatus`, `cancelar`) e o schema `notas_fiscais` já está no plano de migration (`plano-tarefas.md`). O trabalho do Hades/Atlas aqui é **implementar uma classe `BhissNfseService implements NfseService`** que fala com o webservice real, substituindo `MockNfseService` — a UI e o banco não mudam.

## Critério de Aceitação (pra Hades formalizar no plano técnico)
- Emissão de NFS-e de teste em homologação funciona de ponta a ponta (transação paga → XML assinado → envio → nota emitida → status refletido em `notas_fiscais`)
- Erro do webservice da Prefeitura é capturado e mostrado de forma legível (não é um crash silencioso)
- Cancelamento de nota funciona
- Só depois disso, Kleber aprova a troca pra produção
