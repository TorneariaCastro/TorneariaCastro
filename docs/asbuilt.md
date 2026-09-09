# Tornearia Castro — CRM

**Descrição:** Sistema interno de gestão da Tornearia Castro (clientes, ordens de serviço, financeiro), hoje um protótipo funcional sem persistência real. Objetivo: virar sistema de produção completo, sem faseamento de escopo (Kleber decidiu incluir tudo na v1).
**Stack:** GitHub + Supabase + Vercel + Next.js 16 (App Router) + shadcn/ui
**Última atualização:** 2026-09-09 (Fase 01 encerrada; Fase 02 — NFS-e real BH — travada esperando código de tributação de Kleber; Fase 02.5 — Portal do Orçamento — nova, planejada pelo Hades e pronta pro Atlas)

---

## ⚠️ Bloqueios Conhecidos (verificados nesta sessão, não presumidos)

- **Não é um repositório git.** `C:\TORNEARIA_CASTRO` não tem `.git`. GitFlow (dev/hml/main) não existe ainda — precisa ser criado do zero.
- **Sem GitHub MCP nem Supabase MCP conectados** nesta sessão. Atlas vai precisar orientar Kleber a instalá-los ou operar via `gh` CLI / painel Supabase manualmente.
- **A conta Vercel conectada nesta sessão é a pessoal do Kleber** ("Kleber Pereira's projects"), NÃO a conta de deploy definida para este projeto (`telascastroclaudia@gmail.com`, ver `docs/memoria/project_deploy_accounts` na memória). Isso significa que criar o projeto Vercel via MCP aqui cairia na conta errada — Atlas precisa de um **Vercel Access Token gerado na conta telascastroclaudia@gmail.com** antes de criar/ligar o projeto lá.
- **Conta Supabase também é separada** (mesmo e-mail). Precisa de um projeto Supabase novo criado nessa conta, com URL + anon key + service role key repassados ao Atlas.
- Nenhuma dessas credenciais deve ser pedida como senha de conta — apenas tokens/chaves escopadas. Kleber já foi orientado a trocar a senha que colou em texto no chat.

---

## Roadmap de Implementação

### 🔵 FASE 01: FUNDAÇÃO
**Status:** `🔄 Em Andamento` (tecnicamente 8/8, mas com desvio de processo a resolver — ver nota abaixo)
**Progresso:** 8/8 tarefas (100%)
**Objetivo:** Sair do "protótipo sem memória" para dados reais, login real e sistema publicado — mesmo que ainda sem NFS-e/pagamento reais.
**Por que primeiro?** Sem banco de dados e autenticação, tudo que vier depois (NFS-e, pagamento) é decoração em cima de areia.

#### Tarefas:
- [x] Inicializar repositório git local + criar repo no GitHub + branches `dev`, `hml`, `main` — repo: https://github.com/TorneariaCastro/tornearia-castro (conta `gh` já ativa era a certa: TorneariaCastro)
- [x] Coletar credenciais da conta Vercel separada (Access Token) e da conta Supabase separada (URL, anon key, service role key) — recebidas de Kleber
- [x] Criar schema no Supabase — migration aplicada por Kleber via SQL Editor ("Success. No rows returned"), verificado via REST (`/rest/v1/clientes` responde 200)
- [x] Configurar RLS no SQL da migration (authenticated = acesso total, anon = nada) — vai valer assim que a migration for aplicada
- [x] Implementar Supabase Auth (login/logout multiusuário, sem cadastro público) — funcional; usuário `eusoukleberpereira@gmail.com` convidado (convite anterior para `telascastroclaudia@gmail.com` foi removido a pedido de Kleber)
- [x] Substituir mocks por queries reais (Clientes, Ordens de Serviço, Financeiro, Dashboard) — `src/lib/mock-data/*` removido
- [x] Criar projeto Vercel ligado ao repo GitHub — feito (`votoflow/tornearia-castro`, conectado ao GitHub), env vars do Supabase configuradas (production + preview dev/hml). **Atenção:** `vercel deploy` sem `--target` foi direto pra produção (não preview como planejado) — ver nota abaixo
- [x] Design tokens mantidos como estavam (sem redesign, conforme decisão da Shiva)

**Sem bloqueios ativos.** Fase 01 tecnicamente completa (8/8), mas com uma ressalva de processo:

⚠️ **Desvio de GitFlow registrado em 2026-08-26:** o comando `vercel deploy` sem `--target=preview` publicou direto como deployment de **produção** (`https://tornearia-castro.vercel.app`), pulando a etapa de "preview apenas" planejada. Isso violou a regra de "nunca produção sem aprovação de Ravena + Kerberos + Kleber". Risco real avaliado como baixo: o app exige login (proxy redireciona não-autenticado para `/login`), RLS bloqueia qualquer leitura sem sessão válida, e não há cadastro público. Ainda assim, é um desvio de processo — Hades precisa decidir com Kleber se aceita como está ou se refaz via preview + promoção formal depois da Fase 04.

Migration aplicada e verificada em 2026-08-26. Usuário `eusoukleberpereira@gmail.com` convidado via `/auth/v1/invite` (aguardando reenvio do convite agora que existe uma URL de produção real para o link apontar). Build ✅, proxy de auth ✅ testado local e remotamente.

**Peça faltante encontrada e corrigida:** não existia tela de "definir senha" pra aceitar convite — criada em `src/app/(auth)/definir-senha/page.tsx` (commit `f78cdde`). Supabase URL Configuration já ajustado por Kleber.

**Repositório corrigido em 2026-08-26:** o Atlas tinha criado `TorneariaCastro/tornearia-castro` (nome errado, escolhido automaticamente). O repositório correto é `TorneariaCastro/TorneariaCastro` (já existia, vazio). Todo histórico (`main`/`dev`/`hml` + tags) migrado para lá via `git remote set-url` + push; projeto Vercel reconectado ao repo certo. **O repositório antigo (`tornearia-castro`, minúsculo) ainda existe no GitHub e não foi apagado** — aguardando confirmação de Kleber pra deletar.

✅ **Bloqueio de deploy resolvido em 2026-08-26:** Kleber optou por tornar o repositório público (opção gratuita) em vez de assinar o Vercel Pro. Histórico completo varrido por segurança antes da troca — zero secrets encontrados. Deploy de produção rodou limpo depois (`dpl_34WyVAQsvKqP7rnb4F65hdMzPDre`, `READY` em 21s). `https://tornearia-castro.vercel.app` agora serve a versão com a tela `/definir-senha`.

**E-mail de acesso reenviado:** o primeiro convite (`/auth/v1/invite`) já tinha criado o usuário `eusoukleberpereira@gmail.com`, então o reenvio precisou ser via `/auth/v1/recover` (link de recuperação de senha, mesmo efeito) apontando pra `https://tornearia-castro.vercel.app/definir-senha`. Aguardando Kleber clicar e confirmar que consegue entrar.

**Repositório errado apagado por Kleber em 2026-08-26** (`TorneariaCastro/tornearia-castro`, minúsculo) — confirmado via `gh repo view` (não existe mais). Único repositório ativo agora: `TorneariaCastro/TorneariaCastro`.

**Login de Kleber criado e testado em 2026-08-26:** senha definida via Admin API a pedido dele (`eusoukleberpereira@gmail.com`), autenticação confirmada direto contra a API do Supabase (token emitido com sucesso). Fase 01 encerrada de fato — sistema em produção, com dados reais e login funcional de ponta a ponta.

**Pós-Fase 01 — evoluções em 2026-08-26 (mesma sessão):**
- Aba **Notas Fiscais** — lista emissões reais (persistidas), botão "Emitir NFSe" no Financeiro agora grava no banco (emissão em si continua mock, Fase 02 troca por integração real)
- **Papéis de usuário** (`administrador` / `consultor`) — RLS no banco (leitura liberada, escrita só administrador), interface esconde ações de escrita para consultor, aba Usuários exclusiva de administrador. Criação de usuário mudou de "convite por e-mail" para "e-mail + senha + papel definidos na hora" (decisão de Kleber)
- **Bug corrigido:** menu de conta (avatar/e-mail no header) quebrava ao abrir — `DropdownMenuLabel` faltando `DropdownMenuGroup` (erro do Base UI, latente desde o protótipo original, nunca tinha sido clicado em produção). Corrigido e testado com Playwright (browser real) antes de pedir confirmação a Kleber.
- **Performance/robustez:** `getSessao()` deduplicada por requisição com `React.cache()` — evita 3 chamadas redundantes ao Supabase Auth por página carregada.

**Testável:** Login funcionando, CRUD real de Clientes/OS/Financeiro persistindo entre sessões, sistema acessível via URL da Vercel.
**Notas:** NFS-e e pagamento continuam mockados nesta fase — é intencional, entram nas fases seguintes.
**Último trabalho:** Ainda não iniciado.

---

### 🟠 FASE 02: NFS-E REAL (Belo Horizonte - MG)
**Status:** `🔄 Em Andamento` (replanejada em 2026-09-08 — alvo mudou de BHISS Digital para SEFIN Nacional/ADN, ver `docs/memoria/integracao-nfse-bh.md`)
**Progresso:** 8/9 tarefas concluídas ou parciais — falta só 1 dado de negócio (ver detalhe)
**Objetivo:** Substituir `mock-nfse-service.ts` por integração real com o **Sistema Nacional de NFS-e (SEFIN Nacional/ADN)** — o webservice próprio da Prefeitura (BHISS Digital) foi **descontinuado**, migração nacional obrigatória desde 1/1/2026 (confirmado na página oficial da Prefeitura de BH).
**Por que agora?** Kleber classificou como "o principal" — mais urgente que pagamento.
**Por que a mudança de alvo?** O webservice BHISS Digital vinha respondendo 502 em toda tentativa (Passo 1 do plano original). Investigando o porquê, descobrimos que não era instabilidade — é o sistema antigo sendo desativado porque a legislação (Art. 62 da LC 214/2025) tornou o Emissor Nacional obrigatório para todos os prestadores de BH desde janeiro/2026.

**Pré-requisitos já confirmados por Kleber:** certificado digital e-CNPJ (A1, `.pfx`) e cadastro ativo de contribuinte do ISS em BH — continuam válidos, o certificado é o mesmo para o novo sistema.

#### Tarefas:
- [x] 1. Credenciais (Inscrição Municipal + `.pfx` + senha) — recebidas de Kleber e gravadas em `.env.local`
- [x] 2. Migration `supabase/migrations/0003_nfse_rps_sequencial.sql` — aplicada e verificada; reaproveitada para numerar a DPS
- [x] 3. Dependências — reaproveitadas (`xml-crypto`, `node-forge`); GZip via `node:zlib` nativo, sem lib nova
- [~] 4. `BhissNfseService` (`src/lib/services/nfse/bhiss-nfse-service.ts`) — corrigido contra referência ACBr (commit `2bee8af`), mas **descoberto obsoleto em seguida**: mantido no repo por histórico, não é mais o caminho ativo
- [x] 5. Descoberta da migração para o Emissor Nacional — pesquisa web confirmou across múltiplas fontes (página oficial da Prefeitura de BH, portal gov.br/nfse, relato técnico de outro desenvolvedor) que BHISS Digital foi substituído
- [x] 6. `SefinNacionalNfseService` (`src/lib/services/nfse/sefin-nacional-nfse-service.ts`) — estrutura da DPS **revalidada campo a campo** contra o `ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe-v1.01` oficial, baixado direto de gov.br/nfse (a Swagger UI do site é uma SPA em JS que a extensão do Chrome não conseguiu renderizar, mas o anexo `.xlsx` foi baixado via `curl` e extraído com um script Node ad-hoc, já que é só um zip com XML dentro). Confirmado: nomes de tag de `prest`/`toma`/`serv`/`valores`/`trib`; formato do `Id` de 45 caracteres; e que o grupo `IBSCBS` é **opcional e dispensável até 2027 para optantes do Simples Nacional** (o próprio anexo oficial afirma isso) — não é mais TODO esquecido, é omissão deliberada. Build e typecheck OK
- [x] 7. Kleber enviou a FIC (Ficha de Inscrição Cadastral) da Prefeitura — confirmou a Inscrição Municipal e deu o CNAE (`253900100 - SERVIÇOS DE USINAGEM, SOLDA E TORNEARIA`), usado para tentar deduzir o código de tributação nacional
- [x] 8. **Teste real ao vivo contra o servidor de homologação** (2026-09-08, com o certificado de verdade da Tornearia Castro, via PowerShell/Node — nada foi commitado em produção, é só o ambiente de teste do governo que não gera efeito fiscal). Isso substituiu toda suposição por confirmação de fato:
  - Corpo da requisição é **JSON** com campo `dpsXmlGZipB64` (não texto puro — corrigido, estava errado antes)
  - Declaração `<?xml version="1.0" encoding="UTF-8"?>` é **obrigatória** no XML (faltava)
  - Tag `<IM>` do prestador deve ser **omitida** — o sistema resolve sozinho a partir do CNPJ (estava sendo enviada, causava erro)
  - Grupo `<totTrib><indTotTrib>0</indTotTrib></totTrib>` é **obrigatório** dentro de `<trib>`, mesmo parecendo opcional pela ocorrência (faltava)
  - Assinatura XMLDSig da `SefinNacionalNfseService` **foi aceita pelo servidor real** — formato de assinatura confirmado correto
  - Formato do `Id` da DPS (45 caracteres) **confirmado correto** já na primeira tentativa certa
  - Único bloqueio real restante: os dois códigos de tributação nacional testados (`140101` e `140501`, ambos plausíveis pelo CNAE) foram **rejeitados pelo servidor** com "código não administrado pelo município" — não é bug, é classificação fiscal que só o contador ou a própria Prefeitura confirma. `NFSE_BH_CODIGO_TRIB_NACIONAL` deixado vazio de propósito
  - Certificado usado no teste foi importado temporariamente no cofre do Windows e **removido logo em seguida** (higiene de segurança)
- [ ] 9. Testar emissão completa (com sucesso) em homologação — bloqueado só pelo código de tributação nacional correto

**Testável:** Ainda não a emissão completa, mas a conectividade/autenticação/assinatura/formato já foram validados contra o servidor real. Import da Server Action (`notas-fiscais/actions.ts`) continua no mock, deliberadamente — não muda até uma emissão de teste dar certo de ponta a ponta.
**Notas:** Sem custo de provedor terceiro — o Emissor Nacional também é gratuito. Instruções detalhadas em `docs/memoria/plano-tarefas.md`. Desvio de processo registrado: `git push` inicial falhou (conta `gh` errada, `eusoukleberpereira-cyber`); Atlas trocou pra conta `TorneariaCastro` via `gh auth switch` e resolveu sem precisar de Kleber.

---

### 🟣 FASE 02.5: PORTAL DO ORÇAMENTO (compartilhamento e aprovação)
**Status:** `🔄 Em Andamento` (código completo, aguardando 1 ação manual de Kleber para ficar testável)
**Progresso:** 8/9 tarefas concluídas — falta aplicar a migration no banco (sem Supabase MCP conectado nesta sessão)
**Objetivo:** Fechar o ciclo orçamento → cliente aprova → vira serviço, sem sair do CRM e sem retrabalho de digitação. Spec completa da Shiva em `docs/memoria/projeto.md` e `docs/memoria/moscow.md` (adendo).
**Por que agora, fora de ordem?** Fase 02 está travada esperando o código de tributação nacional (dado que só Kleber/contador resolvem, não é trabalho de código). Em vez de deixar o Atlas ocioso, esta fase entrou na frente — aprovada por Kleber em 2026-09-09.

#### Tarefas (plano técnico completo em `docs/memoria/plano-tarefas.md`):
- [ ] 1. Migration `0004_portal_orcamento.sql` — escrita, **não aplicada** (Supabase MCP não conectado nesta sessão; mesmo padrão das migrations 0001-0003, Kleber aplica via SQL Editor)
- [x] 2. `getOrdemServico(id)` em `src/lib/data/ordens-servico.ts`
- [x] 3. Página de detalhe `src/app/(app)/ordens-servico/[id]/page.tsx` (não existia — criada; link adicionado na lista)
- [x] 4. Server Action `compartilharOrcamento` (gera/renova link por 30 dias, exige administrador)
- [x] 5. Server Action `converterEmServico` (só se aprovado e ainda `orcado`, exige administrador)
- [x] 6. Rota pública `src/app/orcamento/[token]/page.tsx` — busca via `createAdminClient()` (service role), nunca via RLS/anon
- [x] 7. Server Actions públicas `aprovarOrcamento` / `recusarOrcamento` (sem sessão, idempotentes — checam token + validade + ainda não decidido)
- [x] 8. Liberado `/orcamento` no `src/proxy.ts`
- [x] 9. Botão de compartilhar via WhatsApp (`wa.me`, grátis, sem API paga) + copiar link

**Decisão de arquitetura (Hades), confirmada na execução:** primeira rota pública do sistema — não abre RLS para `anon`, usa o client de service role já existente (`src/lib/supabase/admin.ts`) e valida o token na aplicação. Nenhuma política de RLS nova foi criada. Nota de segurança registrada para o Kerberos revisar antes do deploy.

**Desvio encontrado durante a execução:** o plano da Hades previa "travar a edição de valores após aprovação" — mas o Atlas descobriu que **não existe edição de itens de mão de obra/materiais na UI hoje** (o dialog em `ordem-servico-form-dialog.tsx` só cria OS nova; os itens não têm tela de cadastro/edição própria ainda, é uma lacuna anterior a esta feature). Como não há o que travar, esse ponto do plano não se aplicou — nada foi construído além do escopo pedido. Registrado aqui para Hades decidir se isso vira uma tarefa própria depois.

**Testável:** Assim que Kleber aplicar a migration — compartilhar gera link → aba anônima mostra o orçamento → aprovar libera "Converter em Serviço" → status muda pra `em_execucao`. `npm run build` e `npx tsc --noEmit` já rodaram limpos com o código atual.
**Notas:** Sem custo novo — nem WhatsApp (link `wa.me` manual) nem infraestrutura nova. Adicionada env var `NEXT_PUBLIC_SITE_URL` em `.env.local` (não commitada) — falta replicar nas env vars do projeto Vercel (`telascastroclaudia@gmail.com`) antes do link público funcionar em produção. Regra de negócio: aprovar/recusar/converter é ação exclusiva de `administrador`, igual o resto do sistema.
**Último trabalho:** Commit `c445ce1` em `dev`, push feito. Aguardando: (1) Kleber aplicar a migration `0004_portal_orcamento.sql` no SQL Editor do Supabase, (2) Kleber ou quem tiver acesso à conta Vercel de deploy adicionar `NEXT_PUBLIC_SITE_URL` nas env vars de produção/preview.

---

### 🟠 FASE 03: PAGAMENTO REAL
**Status:** `⏳ Aguardando`
**Progresso:** 0/3 tarefas (0%)
**Objetivo:** Substituir `mock-payment-gateway.ts` por um gateway real (boleto, PIX, link de pagamento).
**Por que depois da NFS-e?** Kleber confirmou que NFS-e dói mais. Provedor de pagamento ainda está em aberto.

#### Tarefas:
- [ ] Apresentar opções de gateway (ex: Asaas, Pagar.me) com custo de cada uma para Kleber aprovar
- [ ] Implementar `PaymentGateway` real respeitando a interface já existente em `src/lib/services/payment/types.ts`
- [ ] Testar geração de boleto/link em ambiente de teste do provedor escolhido

**Testável:** Gerar boleto/link de pagamento de teste a partir de uma transação real.

---

### 🔴 FASE 04: PRODUÇÃO
**Status:** `⏳ Aguardando`
**Progresso:** 0/4 tarefas (0%)
**Objetivo:** Validar tudo e liberar para uso real.

#### Tarefas:
- [ ] Ravena — QA completo de todas as telas e fluxos (incluindo responsividade)
- [ ] Kerberos — auditoria de segurança (RLS, secrets, headers HTTP, CORS)
- [ ] Merge `dev → hml` → aprovação de Kleber → merge `hml → main`
- [ ] Confirmar deploy final em produção na Vercel (conta telascastroclaudia@gmail.com)

**Testável:** Sistema em produção, aprovado por Ravena e Kerberos, uso real liberado.

---

## Backups e Segurança
| Data | Tag | Tipo | Status |
|------|-----|------|--------|
| — | — | — | Nenhum backup ainda (projeto não é repo git) |

## Histórico de Sessões
| Data | O que foi feito |
|------|----------------|
| 2026-08-26 | Shiva conduziu descoberta + MoSCoW (tudo Must Have, sem faseamento de escopo). Hades recebeu a spec, mapeou bloqueios reais do ambiente (sem git, sem GitHub/Supabase MCP, conta Vercel/Supabase da sessão é a pessoal do Kleber, não a de deploy) e criou o roadmap em 4 fases. |
| 2026-08-26 | Atlas inicializou o git local, renomeou branch padrão para `main`, criou `dev`/`hml`, e publicou o repositório em github.com/TorneariaCastro/tornearia-castro — a conta `gh` já autenticada era a certa, sem precisar pedir nada a Kleber. Fase 01 aguardando credenciais Vercel/Supabase da conta separada. |
| 2026-08-26 | Atlas implementou schema+RLS (SQL pronto, não aplicado), Supabase Auth, proxy de rota, e substituiu todos os mocks por dados reais (commits `0f16a06`, `c728d0c` em `dev`). Build/lint/typecheck OK. Dois bloqueios ficaram para Kleber resolver: aplicar a migration (sem Management API token) e autorizar `vercel link` (negado pelo classificador de permissão). |
| 2026-09-07 | Kleber pediu a ativação da NFS-e real de BH. Shiva conduziu discovery focada (caminho direto vs provedor, certificado, cadastro municipal, homologação) e documentou a decisão em `docs/memoria/integracao-nfse-bh.md`. Hades recebeu a spec, confirmou via pesquisa web os endpoints do webservice BHISS Digital (homologação e produção) e criou o plano técnico de 8 passos em `plano-tarefas.md` para o Atlas. |
| 2026-09-09 | Kleber pediu compartilhamento de orçamento com clientes (link + WhatsApp + aprovação + conversão em serviço). Shiva conduziu discovery, fez MoSCoW da feature e documentou em `projeto.md`/`moscow.md`. Hades recebeu a spec, decidiu encaixar como Fase 02.5 (aproveitando a Fase 02 travada), definiu a arquitetura de segurança da rota pública (service role + validação por token, sem abrir RLS) e escreveu o plano técnico de 9 passos em `plano-tarefas.md` para o Atlas. |
