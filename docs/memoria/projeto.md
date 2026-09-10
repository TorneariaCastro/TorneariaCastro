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

---

## Funcionalidade Adicional: Valor Fechado no Orçamento (2026-09-10)

### Origem
Kleber tentou registrar o preço de uma OS escrevendo "Valor do serviço R$800,00" **dentro do campo de descrição** — texto solto que o sistema não lê, deixando o Valor total em R$ 0,00. Não foi erro de uso: hoje o sistema **só sabe formar preço abrindo horas × valor/hora e quantidade × valor unitário**, e a Tornearia Castro nem sempre precifica assim.

Perguntado como passa preço ao cliente na vida real, Kleber respondeu: **depende do cliente e do tamanho do serviço** — peça pequena sai com preço fechado, serviço grande é aberto para justificar. Ou seja, os dois modos precisam conviver.

### Visão
Acrescentar um terceiro bloco de lançamento — **"Serviço"** — ao lado de *Mão de obra* e *Materiais*, para registrar preço fechado sem abrir a memória de cálculo. O Valor total continua sendo a soma automática de tudo que foi lançado, em qualquer combinação.

### Como funciona
1. Na tela da OS, seção **Valores do serviço**, o bloco **Serviço** aparece **acima** de Mão de obra e Materiais (é o caminho mais comum, deve vir primeiro).
2. Campos: **Descrição · Qtd. · Valor unitário** → botão **Lançar**. Peça única é `1 × R$ 800,00`; lote é `5 × R$ 160,00`.
   - Quantidade existe porque preço fechado na tornearia normalmente é por peça ("faço as 5 buchas a R$ 160 cada"). Sem ela, Kleber faria a conta de cabeça e o registro perderia a informação.
3. **Nenhum bloco é obrigatório e nenhum exclui o outro.** Os três casos reais:

   | Situação | O que se lança |
   |---|---|
   | Peça fechada | Só **Serviço** |
   | Serviço aberto | Só **Mão de obra** + **Materiais** (comportamento atual) |
   | Misto | **Serviço** + **Materiais** (ex: peça fechada + aço comprado à parte) |

4. **Decisão deliberada: não existe um seletor "orçamento fechado ou detalhado".** Obrigaria Kleber a decidir antes de começar e transformaria mudança de ideia em retrabalho. Bloco solto não pergunta nada — usa-se o que serve.
5. As mesmas regras já existentes valem para o bloco novo: só **administrador** lança, e **os valores travam assim que o cliente aprova** (`aprovado_em` preenchido).

### O que o cliente passa a ver (mudança de comportamento — decidida por Kleber)
Hoje a página pública do orçamento (`/orcamento/[token]`) exibe **cada linha de mão de obra com as horas e o subtotal** — de onde qualquer cliente deduz o valor/hora da oficina (ex: `4 h · R$ 480,00` → R$ 120/h).

**Kleber escolheu fechar isso.** A página pública passa a mostrar apenas:
- Número da OS e nome do cliente
- **Descrição do serviço**
- **As linhas do bloco Serviço** — descrição, quantidade e valor da linha (ex: `Bucha de bronze · 5 un · R$ 800,00`)
- **Valor total**
- Os botões Aprovar / Recusar (inalterados)

**Mão de obra e materiais somem por completo da visão do cliente** (confirmado por Kleber em 2026-09-10). A distinção que sustenta a decisão: o bloco **Serviço** descreve *o que o cliente está comprando* — mostrar isso dá confiança, principalmente em lote. Mão de obra e materiais descrevem *como o preço foi formado* — e isso é margem: cliente que sabe a hora discute a hora, e um print encaminhado entrega a formação de preço ao concorrente.

Consequência prática a comunicar no manual: **num orçamento aberto (só mão de obra + materiais), o cliente verá a descrição do serviço e o valor total, sem nenhuma linha.** Se Kleber quiser que o cliente enxergue o que está comprando, o caminho é lançar no bloco Serviço.

### Impacto em cadeia (atenção do Hades — o valor total é usado em vários lugares)
O cálculo hoje vive em `calcularValorTotal()` (`src/lib/types/ordem-servico.ts`) e é somado **em duplicidade** na página pública, que refaz a conta por conta própria. O bloco novo precisa entrar em **todos** os pontos, ou o sistema vai mostrar números diferentes na mesma OS:
- Card "Valor total" na tela da OS
- Coluna **Valor** na listagem de Ordens de Serviço
- **Dashboard** (KPIs e gráficos)
- **Página pública do orçamento**
- **Conta a receber gerada automaticamente ao faturar a OS** — se ficar de fora, a cobrança sai errada
- **NFS-e** — o valor do serviço enviado à Prefeitura vem daí

### Dados novos
- Uma tabela de itens de serviço por OS (descrição, quantidade, valor unitário), no mesmo padrão de `itens_mao_de_obra` / `itens_materiais`, com o mesmo RLS.

### Nota de Segurança (para Kerberos)
A mudança da página pública **reduz** superfície: a consulta por token deve parar de trazer `itens_mao_de_obra` e `itens_materiais` do banco — não basta esconder na tela, o dado não deve sair do servidor. Só os itens do bloco **Serviço** podem ser enviados. O valor total precisa ser calculado **no servidor** e mandado já pronto, porque ele inclui mão de obra e materiais que o cliente não pode ver.

### Fora de escopo
- Escolher no momento de compartilhar entre "enviar detalhado" ou "enviar só o total" (avaliado e descartado: só vale se os dois formatos forem realmente usados)
- Desconto, acréscimo ou negociação de valor sobre o total
- Tabela de preços padrão / catálogo de peças recorrentes
