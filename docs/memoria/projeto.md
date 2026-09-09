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

---

## Funcionalidade Adicional: Compartilhamento e Aprovação de Orçamento (2026-09-09)

### Visão
Hoje, um "orçamento" é apenas uma Ordem de Serviço no status `orcado` — não existe entidade separada. O cliente só sabe o valor por telefone ou print manual. Esta funcionalidade fecha o ciclo **orçamento → cliente aprova → vira serviço**, sem sair do CRM e sem retrabalho de digitação.

### Como funciona
1. Uma OS em status `orcado` ganha um **link público de orçamento** — página somente-leitura, sem exigir login, com layout profissional (reaproveita o design system existente, nada de tela de admin exposta).
2. O acesso é protegido por um **token único e não-adivinhável** por OS (não é `/orcamento/123`).
3. Um botão de compartilhar copia o link e também **abre o WhatsApp do cliente** com a mensagem e o link pré-preenchidos (link tipo `wa.me/...` — abertura manual, sem custo, sem WhatsApp Business API).
4. Na página pública, o cliente pode **Aprovar** ou **Recusar** o orçamento. Ao aprovar, fica registrada a data/hora e os valores travam para edição.
5. Dentro do CRM, uma OS aprovada ganha um botão **"Converter em Serviço"**, que avança o status da mesma OS para `em_execucao` — sem duplicar dado nenhum, é a mesma OS que já existia.

### Dados novos por Ordem de Serviço
- Token de compartilhamento do link público
- Situação de aprovação do cliente (pendente / aprovado / recusado) e data/hora
- (Should) Validade do link (expiração)
- (Could) Registro de visualizações do link (quem/quando abriu)

### Nota de Segurança (para Hades/Kerberos)
Esta é a primeira "porta lateral" pública do sistema — hoje tudo exige login e RLS bloqueia acesso não autenticado. A página pública de orçamento precisa expor **apenas** os dados daquela OS específica, validados pelo token, e nada mais do CRM. Kerberos deve auditar essa rota com atenção redobrada antes do deploy.

### Fora de escopo por enquanto (Won't Have)
- Envio automático via WhatsApp Business API (tem custo mensal + aprovação da Meta)
- Assinatura digital com validade jurídica formal
