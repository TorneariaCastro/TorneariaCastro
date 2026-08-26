# Plano de Tarefas — FASE 01: FUNDAÇÃO

## INSTRUÇÕES PARA ATLAS — Inicializar Git + GitFlow

### Contexto
O projeto `C:\TORNEARIA_CASTRO` não é um repositório git. Antes de qualquer outra coisa (Supabase, Vercel, código), a fundação de versionamento precisa existir, porque todo o resto depende de branches `dev`/`hml`/`main`.

### Pré-condições
- [ ] Nenhuma — este é o primeiro passo do projeto.

### Passos (executar NA ORDEM)

**PASSO 1: Inicializar git local**
```bash
git init
git add -A
git commit -m "chore: estado inicial do protótipo (mock data, sem persistência)"
```
Resultado esperado: repositório git criado com um commit inicial.

**PASSO 2: Criar branches do GitFlow**
```bash
git branch dev
git branch hml
```
Resultado esperado: 3 branches locais (main, dev, hml) apontando pro mesmo commit.

**PASSO 3: Criar repositório remoto no GitHub**
Se `gh` CLI estiver autenticado, usar:
```bash
gh repo create tornearia-castro --private --source=. --remote=origin
git push -u origin main dev hml
```
Se `gh` não estiver autenticado, seguir o Protocolo de MCP Não Instalado do Hades e orientar Kleber a autenticar (`gh auth login`) — nunca pedir para ele criar o repo manualmente pelo navegador se dá pra automatizar.

Resultado esperado: repositório remoto criado, 3 branches publicadas.

### Credenciais necessárias (bloqueio real, não pular etapa)
Antes de seguir para Supabase e Vercel desta fase, o Atlas precisa pedir a Kleber (UMA vez, e só porque são contas separadas às quais esta sessão não tem acesso):
1. **Vercel Access Token** da conta `telascastroclaudia@gmail.com` (gerado em vercel.com/account/tokens)
2. **Projeto Supabase** criado na mesma conta, com: Project URL, `anon key`, `service role key`

Sem vault configurado neste ambiente (`~/.claude/config/vault-protocol.md` não existe) — Atlas deve colocar essas chaves diretamente no `.env.local` do projeto (nunca commitado — confirmar que `.gitignore` cobre `.env*.local`) e nunca reutilizar a senha de conta que Kleber colou por engano no chat em 2026-08-26.

### Critério de Aceitação
`git status` limpo, `git branch -a` mostrando main/dev/hml locais e remotas, repo visível no GitHub.

### Em caso de erro
Parar e reportar a Hades com output completo do terminal.

---

## INSTRUÇÕES PARA ATLAS — Criar e ligar o projeto Vercel (conta telascastroclaudia@gmail.com)

### Contexto
Kleber forneceu um Vercel Access Token da conta separada de deploy. A conta Vercel já conectada nesta sessão via MCP é a pessoal do Kleber — por isso este passo usa a Vercel CLI com o token explícito, NÃO o MCP (que criaria na conta errada).

### Pré-condições
- [ ] Fase de git/GitHub concluída (repo em github.com/TorneariaCastro/tornearia-castro, branch `main` publicada)

### Credencial
Token recebido de Kleber no chat: use como variável de ambiente **apenas na sessão do terminal atual** (`export VERCEL_TOKEN=...` / `$env:VERCEL_TOKEN=...`). NÃO escrever em nenhum arquivo do repositório, NÃO colocar em `.env`/`.env.local` — este é um token de ferramenta (deploy), não uma env var que o app Next.js deve ler em runtime. Não existe vault configurado neste ambiente (`~/.claude/config/vault-protocol.md` não existe) — se precisar dele de novo em uma sessão futura, peça a Kleber novamente em vez de persistir em disco.

### Passos (executar NA ORDEM)

**PASSO 1: Garantir Vercel CLI disponível**
```bash
npx vercel --version
```
Se falhar, usar `npx vercel@latest` nos comandos seguintes (não precisa instalar globalmente).

**PASSO 2: Confirmar que o token pertence à conta certa**
```bash
npx vercel whoami --token="$VERCEL_TOKEN"
```
Resultado esperado: usuário/e-mail associado a `telascastroclaudia@gmail.com`. Se vier outra conta, PARAR e reportar a Hades — não prosseguir com a conta errada.

**PASSO 3: Criar o projeto Vercel ligado ao GitHub**
```bash
npx vercel link --token="$VERCEL_TOKEN" --project=tornearia-castro --yes
```
Se o CLI não conseguir importar direto do GitHub automaticamente (pode faltar a instalação do Vercel GitHub App na org `TorneariaCastro` para essa conta Vercel), documentar isso e reportar a Hades — não é um erro de execução, é um pré-requisito de conta que só Kleber resolve (instalar o app do Vercel no GitHub org via um clique).

**PASSO 4: Deploy inicial de verificação (preview, não produção)**
```bash
npx vercel deploy --token="$VERCEL_TOKEN"
```
Resultado esperado: URL de preview funcionando, mostrando o protótipo atual (ainda com mock data — isso é esperado nesta etapa).

### Critério de Aceitação
`vercel whoami` confirma a conta certa; projeto criado; deploy de preview acessível via URL.

### Em caso de erro
Classificar (Terminal / Retryable) conforme protocolo SHIELDA. Se for falta de permissão de conta (ex: GitHub App não instalado), é 🔴 Terminal — reportar a Hades com a mensagem exata.

---

## INSTRUÇÕES PARA ATLAS — Schema Supabase + RLS + Auth + substituir mocks

### Contexto
Kleber forneceu `anon key` e `service_role key`. O Project URL não precisou ser pedido — o `ref` do projeto (`tjrufvlvkxlcnmcjeuns`) está embutido no payload do JWT das duas chaves, então a URL é `https://tjrufvlvkxlcnmcjeuns.supabase.co`. Confirme isso no PASSO 1 antes de confiar cegamente (protocolo de memória cética — verificar, não presumir).

Decisão de arquitetura (Hades): **sem cadastro público**. Como todos os usuários são administradores da própria Tornearia Castro (não há clientes externos logando), não construir tela de signup — usuários são convidados diretamente pelo painel do Supabase (Authentication → Users → Invite) ou via Admin API. Isso evita construir e proteger um fluxo de registro que não tem por que existir.

### Pré-condições
- [ ] Vercel (tarefa anterior neste arquivo) pode rodar em paralelo — não bloqueia esta tarefa
- [ ] `.env.local` ainda não existe no projeto

### Credenciais
```
NEXT_PUBLIC_SUPABASE_URL=https://tjrufvlvkxlcnmcjeuns.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key fornecida por Kleber no chat>
SUPABASE_SERVICE_ROLE_KEY=<service_role key fornecida por Kleber no chat>
```
A `service_role key` NUNCA leva prefixo `NEXT_PUBLIC_` — ela ignora RLS e não pode vazar pro navegador. Usar apenas em código server-side (Server Actions/Route Handlers) ou scripts de migration rodados localmente.

### Passos (executar NA ORDEM)

**PASSO 1: Validar a URL derivada do JWT**
```bash
curl -s -o /dev/null -w "%{http_code}" "https://tjrufvlvkxlcnmcjeuns.supabase.co/rest/v1/" -H "apikey: <anon key>"
```
Esperado: `200` ou `401` (ambos confirmam que o host existe e responde). Erro de DNS/timeout = reportar a Hades antes de prosseguir.

**PASSO 2: Criar `.env.local` (git-ignored — confirmar antes de escrever)**
Confirmar que `.env*` está no `.gitignore` (já confirmado anteriormente) e então criar o arquivo com as 3 variáveis acima.

**PASSO 3: Instalar dependências do Supabase**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**PASSO 4: Criar migration SQL com o schema abaixo**
Arquivo `supabase/migrations/0001_init.sql` (rodar via Supabase SQL Editor ou CLI, usando a `service_role key`):

```sql
create extension if not exists "pgcrypto";

create table clientes (
  id uuid primary key default gen_random_uuid(),
  tipo_pessoa text not null check (tipo_pessoa in ('fisica','juridica')),
  nome text not null,
  documento text not null unique,
  inscricao_estadual text,
  inscricao_municipal text,
  email text not null,
  telefone text not null,
  endereco jsonb not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  observacoes text
);

create table ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  cliente_id uuid not null references clientes(id),
  status text not null check (status in ('rascunho','orcado','em_execucao','pronto','faturado','cancelado')),
  descricao_servico text not null,
  data_abertura timestamptz not null default now(),
  previsao_entrega timestamptz,
  data_conclusao timestamptz,
  observacoes text
);

create table itens_mao_de_obra (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references ordens_servico(id) on delete cascade,
  descricao text not null,
  horas numeric not null,
  valor_hora numeric not null
);

create table itens_materiais (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references ordens_servico(id) on delete cascade,
  descricao text not null,
  quantidade numeric not null,
  unidade text not null,
  valor_unitario numeric not null
);

create table transacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receita','despesa')),
  descricao text not null,
  categoria text check (categoria in ('materia_prima','ferramentas_corte','energia','manutencao','salarios','impostos','outros')),
  cliente_id uuid references clientes(id),
  ordem_servico_id uuid references ordens_servico(id),
  valor numeric not null,
  data_vencimento timestamptz not null,
  data_pagamento timestamptz,
  status text not null check (status in ('pendente','pago','atrasado','cancelado')),
  metodo text check (metodo in ('boleto','pix','cartao_credito','cartao_debito','transferencia','dinheiro'))
);

create table notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references ordens_servico(id),
  numero text,
  codigo_verificacao text,
  status text not null default 'nao_emitida' check (status in ('nao_emitida','processando','emitida','erro','cancelada')),
  valor_servico numeric not null,
  aliquota_iss numeric not null,
  valor_iss numeric not null,
  data_emissao timestamptz,
  link_pdf text,
  mensagem_erro text
);

alter table clientes enable row level security;
alter table ordens_servico enable row level security;
alter table itens_mao_de_obra enable row level security;
alter table itens_materiais enable row level security;
alter table transacoes_financeiras enable row level security;
alter table notas_fiscais enable row level security;

create policy "authenticated_full_access" on clientes for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on ordens_servico for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on itens_mao_de_obra for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on itens_materiais for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on transacoes_financeiras for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on notas_fiscais for all to authenticated using (true) with check (true);
```

Nenhuma política para `anon` — sem RLS liberado, não-autenticado não lê nem escreve nada. Todos os usuários autenticados têm o mesmo acesso total (decisão da Shiva: todos administradores, sem hierarquia nesta versão).

**PASSO 5: Implementar login (Supabase Auth, e-mail+senha)**
- Cliente Supabase (`src/lib/supabase/client.ts` e `server.ts`, padrão `@supabase/ssr`)
- Middleware de proteção de rota (redireciona para `/login` se não autenticado)
- Tela `/login` simples (e-mail + senha) reaproveitando os componentes shadcn já existentes (`Input`, `Button`, `Card`)

**PASSO 6: Substituir mocks por queries reais**
- `src/lib/mock-data/clientes.ts` → queries Supabase nas páginas de Clientes
- `src/lib/mock-data/ordens-servico.ts` → queries Supabase (incluindo itens de mão de obra e materiais)
- `src/lib/mock-data/transacoes.ts` → queries Supabase no Financeiro
- Manter os serviços mock de NFS-e/pagamento como estão — fora de escopo desta tarefa (Fases 02/03)

### Critério de Aceitação
`npm run build` sem erros. Login funcional. Criar/editar um cliente e uma ordem de serviço persiste após recarregar a página (prova de que não é mais mock). Usuário não-autenticado não consegue acessar `/dashboard`, `/clientes`, `/ordens-servico`, `/financeiro`.

### Em caso de erro
Erro de schema/RLS = 🔴 Terminal, reportar a Hades com a mensagem exata do Postgres. Erro de dependência/instalação = seguir protocolo Retryable (3x) antes de escalar.
