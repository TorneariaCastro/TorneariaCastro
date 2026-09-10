# Priorização MoSCoW — Tornearia Castro

> Kleber optou por não adiar nenhum item: tudo abaixo entra na primeira versão de produção. Não há itens em Should/Could/Won't nesta rodada — a lista pode ser revisitada com o Hades se o esforço técnico pedir um faseamento de execução (o que é diferente de cortar escopo).

## 📦 MUST HAVE (Primeira Versão)
- [ ] Banco de dados real (Supabase) para Clientes, Ordens de Serviço e Financeiro — dados param de resetar
- [ ] Autenticação multiusuário (Supabase Auth) — todos os usuários com papel de administrador
- [ ] Emissão real de NFS-e para o município de Belo Horizonte - MG, substituindo o serviço mock
- [ ] Cobrança/pagamento real (provedor a definir com Kleber), substituindo o serviço mock
- [ ] Deploy em produção na Vercel, conta `telascastroclaudia@gmail.com`, ligado ao Supabase da mesma conta

## 📦 SHOULD HAVE (Logo Depois)
_Nenhum item adiado nesta rodada._

## 📦 COULD HAVE (Se Der Tempo)
_Nenhum item adiado nesta rodada._

## 📦 WON'T HAVE (Futuro)
_Nenhum item adiado nesta rodada._

---

## Adendo — Compartilhamento e Aprovação de Orçamento (2026-09-09)

> Feature adicionada após validação de escopo com Kleber, quebrada em MoSCoW própria.

### 📦 MUST HAVE
- [ ] Link público de orçamento (token único, somente leitura, layout profissional)
- [ ] Botões Aprovar / Recusar na página pública, com data/hora registrada e trava de edição após aprovação
- [ ] Botão "Converter em Serviço" no CRM, disponível quando a OS está aprovada, avança status para `em_execucao`
- [ ] Botão de compartilhar que copia o link e abre o WhatsApp do cliente com mensagem pronta (`wa.me`, sem custo)

### 📦 SHOULD HAVE
- [ ] Expiração do link público (ex: 30 dias)

### 📦 COULD HAVE
- [ ] Histórico de visualizações do link (quem/quando abriu)

### 📦 WON'T HAVE (por agora)
- [ ] Envio automático via WhatsApp Business API (custo mensal + aprovação Meta)
- [ ] Assinatura digital com validade jurídica formal

---

## Adendo — Valor Fechado no Orçamento (2026-09-10)

> Feature nascida de um tropeço real de uso: Kleber escreveu o preço na descrição porque não havia onde lançar valor fechado. Spec completa em `projeto.md`.

### 📦 MUST HAVE
- [ ] Bloco **Serviço** (Descrição · Qtd. · Valor unitário) na seção "Valores do serviço", acima de Mão de obra e Materiais
- [ ] Valor total somando os três blocos em **todos** os lugares onde aparece: tela da OS, listagem, Dashboard, página pública, conta a receber ao faturar, e NFS-e
- [ ] Mesmas travas dos blocos existentes: só administrador lança, e valores congelam após aprovação do cliente
- [ ] Página pública do orçamento passa a mostrar **descrição do serviço + linhas do bloco Serviço + valor total** — sem mão de obra, sem horas, sem valor/hora, sem materiais (decisão de Kleber: mostrar o que o cliente compra, esconder como o preço foi formado)
- [ ] Mão de obra e materiais param de ser **buscados do banco** na rota pública, não só escondidos da tela; valor total calculado no servidor (nota do Kerberos)

### 📦 SHOULD HAVE
- [ ] Manual do sistema atualizado numa passada só: bloco novo + aviso de que os números cinzas dos campos são exemplos, não valores preenchidos + nota de que vírgula funciona (`120,50`)
- [ ] Manual (`docs/manual-do-sistema.html` / `.pdf`) versionado no git — hoje está solto na pasta, fora do histórico

### 📦 COULD HAVE
_Nenhum item nesta caixa — a exibição das linhas do bloco Serviço ao cliente foi promovida a Must Have por decisão de Kleber em 2026-09-10._

### 📦 WON'T HAVE (por agora)
- [ ] Escolher no compartilhamento entre "enviar detalhado" e "enviar só o total"
- [ ] Desconto / acréscimo sobre o valor total
- [ ] Tabela de preços padrão ou catálogo de peças recorrentes
