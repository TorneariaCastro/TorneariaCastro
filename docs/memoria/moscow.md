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
