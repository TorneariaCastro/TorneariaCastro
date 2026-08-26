# Tornearia Castro — Constituição

## Visão
Sistema de gestão interno (CRM) para a Tornearia Castro, empresa de usinagem/torneamento (torno CNC, solda de recomposição, retífica, fresamento, fabricação de peças sob medida). Hoje existe como protótipo funcional em Next.js, sem dados persistentes, sem login e sem integrações reais — o objetivo desta fase é torná-lo um sistema de produção completo.

## Público-alvo
Uso interno da Tornearia Castro. Múltiplos usuários, todos com papel de **administrador** (sem hierarquia de permissões diferenciada nesta versão) — o próprio Kleber e outras pessoas da equipe.

## Estrutura de Páginas (já construída na UI)
- **Dashboard** — KPIs, gráfico de receita/despesa, gráfico de status de OS, ações rápidas
- **Clientes** — listagem + detalhe (`/clientes/[id]`) + cadastro/edição (dialog)
- **Ordens de Serviço** — listagem, cadastro/edição (dialog), status (rascunho, orçado, em_execucao, pronto, faturado), mão de obra e materiais por OS
- **Financeiro** — contas a receber / contas a pagar, geração de cobrança, emissão de NFS-e por transação paga

## Entidades de Dados (hoje mockadas em arquivos TS, sem banco)
- **Clientes**
- **Ordens de Serviço** (com itens de mão de obra e materiais)
- **Transações financeiras** (receitas e despesas, com categoria de despesa e status)

## Integrações Necessárias
- **NFS-e** — emissão real para o município de **Belo Horizonte - MG**. Hoje é um serviço mock (`src/lib/services/nfse/mock-nfse-service.ts`) atrás de uma interface (`NfseService`) já preparada para receber a implementação real.
- **Pagamento (boleto/link de pagamento/PIX)** — provedor **em aberto**, a definir com Kleber (via protocolo de marketplace, apresentando custo antes de contratar). Hoje é um serviço mock (`src/lib/services/payment/mock-payment-gateway.ts`) atrás de uma interface (`PaymentGateway`) já preparada.

## Stack Definida
- **Frontend/Deploy:** Next.js 16 + shadcn/ui, deploy na Vercel — **conta separada**: `telascastroclaudia@gmail.com` (não é a conta pessoal do Kleber já conectada nesta sessão)
- **Backend/Dados:** Supabase (PostgreSQL + Auth) — **mesma conta separada**: `telascastroclaudia@gmail.com`
- Autenticação multiusuário via Supabase Auth, todos os usuários como administradores (sem RLS diferenciado por papel nesta versão — mas RLS deve proteger contra acesso não autenticado)

## Decisão de Escopo
Kleber optou por **não fasear** — todos os itens abaixo (ver `moscow.md`) entram juntos na primeira versão de produção, mesmo sabendo que isso estende o prazo até o primeiro lançamento.
