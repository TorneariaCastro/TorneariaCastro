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
**Status:** `🔄 Em Andamento`
**Progresso:** 5/8 tarefas (62%) — os 3 restantes exigem ação de Kleber, não são mais trabalho de código
**Objetivo:** Sair do "protótipo sem memória" para dados reais, login real e sistema publicado — mesmo que ainda sem NFS-e/pagamento reais.
**Por que primeiro?** Sem banco de dados e autenticação, tudo que vier depois (NFS-e, pagamento) é decoração em cima de areia.

#### Tarefas:
- [x] Inicializar repositório git local + criar repo no GitHub + branches `dev`, `hml`, `main` — repo: https://github.com/TorneariaCastro/tornearia-castro (conta `gh` já ativa era a certa: TorneariaCastro)
- [x] Coletar credenciais da conta Vercel separada (Access Token) e da conta Supabase separada (URL, anon key, service role key) — recebidas de Kleber
- [ ] Criar schema no Supabase — SQL pronto em `supabase/migrations/0001_init.sql`, mas **não aplicado ainda**: precisa de um Supabase Access Token (Management API) ou de Kleber rodar o script no SQL Editor do painel
- [x] Configurar RLS no SQL da migration (authenticated = acesso total, anon = nada) — vai valer assim que a migration for aplicada
- [x] Implementar Supabase Auth (login/logout multiusuário, sem cadastro público) — código pronto, só falta um usuário existir no projeto (Kleber convida via painel) e a migration estar aplicada
- [x] Substituir mocks por queries reais (Clientes, Ordens de Serviço, Financeiro, Dashboard) — `src/lib/mock-data/*` removido
- [ ] Criar projeto Vercel ligado ao repo GitHub — **bloqueado**: `vercel link` foi negado pelo classificador de permissão desta sessão, aguardando confirmação de Kleber
- [x] Design tokens mantidos como estavam (sem redesign, conforme decisão da Shiva)

**Bloqueios ativos desta fase:**
1. Migration SQL não aplicada no banco (falta Access Token de Management API ou Kleber rodar manualmente)
2. Projeto Vercel não criado/ligado (falta confirmação de Kleber para o comando `vercel link`)

Sem esses dois, o app está com código pronto e testado (`npm run build` ✅, proxy de auth ✅ testado localmente) mas ainda não está rodando com dados reais em produção.

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
