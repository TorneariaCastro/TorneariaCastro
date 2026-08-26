# Tornearia Castro — CRM

**Descrição:** Sistema interno de gestão da Tornearia Castro (clientes, ordens de serviço, financeiro), hoje um protótipo funcional sem persistência real. Objetivo: virar sistema de produção completo, sem faseamento de escopo (Kleber decidiu incluir tudo na v1).
**Stack:** GitHub + Supabase + Vercel + Next.js 16 (App Router) + shadcn/ui
**Última atualização:** 2026-08-26 (Fase 01 iniciada — git/GitHub prontos)

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

**Peça faltante encontrada e corrigida:** não existia tela de "definir senha" pra aceitar convite — criada em `src/app/(auth)/definir-senha/page.tsx` (commit `f78cdde`), mas **ainda não redeployada** (segundo `vercel deploy` bloqueado pelo classificador de permissão de novo — aprovação não persiste entre chamadas). Falta também configurar em Supabase (Authentication → URL Configuration) a Site URL / Redirect URLs para aceitar `https://tornearia-castro.vercel.app/definir-senha` — chave de serviço não dá acesso a essa configuração.

**Testável:** Login funcionando, CRUD real de Clientes/OS/Financeiro persistindo entre sessões, sistema acessível via URL da Vercel.
**Notas:** NFS-e e pagamento continuam mockados nesta fase — é intencional, entram nas fases seguintes.
**Último trabalho:** Ainda não iniciado.

---

### 🟠 FASE 02: NFS-E REAL (Belo Horizonte - MG)
**Status:** `⏳ Aguardando`
**Progresso:** 0/3 tarefas (0%)
**Objetivo:** Substituir `mock-nfse-service.ts` por integração real com o webservice de NFS-e da prefeitura de Belo Horizonte.
**Por que agora?** Kleber classificou como "o principal" — mais urgente que pagamento.

#### Tarefas:
- [ ] Pesquisar/confirmar o webservice de NFS-e usado por Belo Horizonte-MG e seus requisitos (certificado digital A1, credenciamento, etc.)
- [ ] Implementar `NfseService` real respeitando a interface já existente em `src/lib/services/nfse/types.ts`
- [ ] Testar emissão em ambiente de homologação antes de ligar em produção

**Testável:** Emitir uma NFS-e de teste com sucesso a partir de uma transação paga.
**Notas:** Pode exigir custo (certificado digital, taxa de credenciamento) — segue Protocolo de Consciência Orçamentária: cotar e apresentar a Kleber antes de contratar.

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
