# Tornearia Castro — CRM

**Descrição:** Sistema interno de gestão da Tornearia Castro (clientes, ordens de serviço, financeiro), hoje um protótipo funcional sem persistência real. Objetivo: virar sistema de produção completo, sem faseamento de escopo (Kleber decidiu incluir tudo na v1).
**Stack:** GitHub + Supabase + Vercel + Next.js 16 (App Router) + shadcn/ui
**Última atualização:** 2026-09-07 (Fase 01 encerrada; Fase 02 — NFS-e real BH — planejada pelo Hades e pronta pro Atlas)

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
**Status:** `🔄 Em Andamento` (Atlas iniciou execução — falta só 1 bloqueio, ver abaixo)
**Progresso:** 4/8 tarefas concluídas, 2 parciais (50%)
**Objetivo:** Substituir `mock-nfse-service.ts` por integração real, direta, com o webservice BHISS Digital (Prefeitura de BH) — sem provedor intermediário (decisão de Kleber, validada com a Shiva em 2026-09-07, ver `docs/memoria/integracao-nfse-bh.md`).
**Por que agora?** Kleber classificou como "o principal" — mais urgente que pagamento.
**Por que sem provedor?** Zero custo recorrente — mas em troca o Atlas constrói e mantém SOAP+XMLDSig+mTLS na mão. Kryptonita do Hades é dinheiro jogado fora, então essa decisão já nasce com minha bênção — só não finge que é simples.

**Pré-requisitos já confirmados por Kleber:** certificado digital e-CNPJ (A1, `.pfx`) e cadastro ativo de contribuinte do ISS em BH.

#### Tarefas:
- [~] 1. Confirmar documentação técnica vigente — **bloqueado**: `bhissdigital.pbh.gov.br` (portal, manual PDF, WSDL) responde 502 em todas as tentativas. Kleber autorizou seguir com o padrão ABRASF geral/manual de 2009 enquanto o site não volta; campos exatos do XML ficam marcados `TODO` no código até revalidação
- [ ] 2. Pedir a Kleber (uma vez): Inscrição Municipal + arquivo `.pfx` do certificado + senha do certificado — **aguardando Kleber enviar**
- [~] 3. Guardar credenciais como segredo — placeholders já criados em `.env.local` (`NFSE_BH_INSCRICAO_MUNICIPAL`, `NFSE_BH_CERTIFICADO_PFX_BASE64`, `NFSE_BH_CERTIFICADO_SENHA`, `NFSE_BH_WSDL_URL` já apontando para homologação); valores reais pendentes da tarefa 2
- [x] 4. Dependências instaladas: `xml-crypto`, `node-forge`, `fast-xml-parser`, `@types/node-forge` (commit `b6c78f2`)
- [x] 5. Migration `supabase/migrations/0003_nfse_rps_sequencial.sql` — criada e **aplicada por Kleber via SQL Editor em 2026-09-07**; verificado via chamada real ao RPC `nextval_nfse_rps_sequencial` (HTTP 200, retornou `1`) — confirmado que sequence, colunas e função existem no banco
- [x] 6. `BhissNfseService` implementado em `src/lib/services/nfse/bhiss-nfse-service.ts` — **import da Server Action deliberadamente NÃO trocado ainda** (`notas-fiscais/actions.ts` continua no mock) para não quebrar a emissão em produção antes de ter certificado real e teste em homologação
- [ ] 7. Testar em homologação — bloqueado até tarefas 2/3 e migration aplicada
- [ ] 8. Este relatório cumpre parcialmente — retomar ao concluir 7

**Testável:** Emitir uma NFS-e de teste com sucesso em homologação a partir de uma transação paga. Ainda não testável — falta certificado real.
**Notas:** Sem custo de provedor — já é o caminho "de graça" (via direta com a Prefeitura). Instruções detalhadas de cada passo em `docs/memoria/plano-tarefas.md`. Desvio de processo registrado: `git push` inicial falhou (conta `gh` errada, `eusoukleberpereira-cyber`); Atlas trocou pra conta `TorneariaCastro` via `gh auth switch` e resolveu sem precisar de Kleber.

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
