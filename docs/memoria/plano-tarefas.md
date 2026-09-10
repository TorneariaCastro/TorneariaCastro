# Plano de Tarefas

## ÍNDICE
- FASE 01: FUNDAÇÃO (concluída — ver seções abaixo)
- FASE 02: NFS-E REAL — BELO HORIZONTE (travada esperando código de tributação de Kleber)
- FASE 02.5: PORTAL DO ORÇAMENTO — compartilhamento, aprovação e conversão (abaixo, no fim do arquivo)

---

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

---

# Plano de Tarefas — FASE 02: NFS-E REAL (Belo Horizonte - MG)

## ⚠️ REPLANEJADO EM 2026-09-08 — alvo mudou de BHISS Digital para SEFIN Nacional/ADN

O plano original abaixo (Passos 1-8) mirava o webservice próprio da Prefeitura de BH (BHISS Digital). Descobrimos que desde 1/1/2026 isso foi substituído pelo Emissor Nacional de NFS-e (obrigatório) — ver `docs/memoria/integracao-nfse-bh.md` para a decisão completa. O código-alvo agora é `src/lib/services/nfse/sefin-nacional-nfse-service.ts` (já criado e com build/typecheck ok), não mais `bhiss-nfse-service.ts` (mantido por histórico, não usado).

**Status real dos passos, com o novo alvo:**
- [x] Credenciais (Inscrição Municipal + `.pfx` + senha) — já coletadas e gravadas em `.env.local`, continuam válidas (mesmo certificado)
- [x] Dependências — não precisou de libs novas (reaproveita `xml-crypto`/`node-forge`; GZip é `node:zlib`, nativo)
- [x] Migration de numeração sequencial (`0003_nfse_rps_sequencial`) — reaproveitada para numerar a DPS também
- [~] `SefinNacionalNfseService` implementado com a camada de transporte (endpoints, GZip+Base64, assinatura XMLDSig, mTLS) com confiança alta, cruzada entre a página oficial `gov.br/nfse` e relatos técnicos reais de outros desenvolvedores — **mas a estrutura interna exata da tag `<DPS>`/`<infDPS>` (campos de prestador/tomador/serviço/valores, e os campos de IBS/CBS exigidos desde agosto/2026) não foi validada contra o XSD oficial** (documentação é uma SPA em JavaScript que não foi possível renderizar nesta sessão, e o PDF oficial não pode ser extraído como texto) — tudo isso está marcado com `TODO` explícito no código
- [ ] Testar em homologação — **bloqueado**: não é mais o BHISS que está de boca fechada, é uma limitação desta sessão em acessar a documentação oficial completa. Antes de testar, alguém precisa confirmar a estrutura da DPS contra o XSD oficial (`www.gov.br/nfse` → Documentação Técnica → APIs Prod. Restrita e Produção) — provavelmente abrindo num navegador de verdade, já que as ferramentas automatizadas desta sessão não renderizam a Swagger UI
- [ ] Campos de IBS/CBS — não implementados ainda

**Contexto original (Fase 01 e motivação), ainda válido:**

A Fase 01 está encerrada: banco real, auth real, papéis (administrador/consultor) funcionando em produção. Agora a peça que falta é a mais importante do negócio — emitir nota fiscal de verdade.

**Contrato que já existe e não muda** (`src/lib/services/nfse/types.ts`): `NfseService` com `emitir()`, `consultarStatus()`, `cancelar()`. A Server Action que já chama isso é `src/app/(app)/notas-fiscais/actions.ts` (função `emitirNfse`) — hoje importa `nfseService` de `mock-nfse-service.ts`. A troca desse import só deve acontecer depois que a estrutura da DPS estiver validada e testada em homologação.

---

## Plano original (BHISS Digital) — mantido abaixo por histórico, NÃO é mais o alvo ativo

**Endpoints do webservice (confirmados via pesquisa, mas RE-CONFIRME no Passo 1 antes de codificar — não presuma):**
- Homologação (teste, sem valor fiscal): `https://bhisshomologa.pbh.gov.br/bhiss-ws/nfse?wsdl`
- Produção (valor fiscal real): `https://bhissdigital.pbh.gov.br/bhiss-ws/nfse?wsdl`

---

## PASSO 1 — Confirmar a documentação técnica vigente (não presumir)

A versão do manual de integração que encontrei em busca é de **2009** — municípios costumam evoluir o layout (ABRASF 1.0 → 2.0x) sem trocar a URL. Antes de escrever uma linha de código:

1. Acesse `www.pbh.gov.br/bhissdigital` (portal) e `bhissdigital.pbh.gov.br` e baixe o manual de integração e o XSD **vigentes hoje**, não os de 2009.
2. Confirme: versão do layout ABRASF em uso, algoritmo de assinatura exigido (historicamente SHA-1/RSA no ABRASF — confirme se BH já exige SHA-256), a operação SOAP usada para emitir NFS-e a partir de RPS de forma síncrona (esperado: `GerarNfse`, recebendo um lote com 1 RPS), e as operações de consulta/cancelamento (`ConsultarNfse`, `CancelarNfse` ou nomes equivalentes no WSDL real).
3. Referência cruzada útil (não é a fonte oficial, mas ajuda a validar campos e particularidades de BH que fogem do ABRASF padrão): o projeto open-source **ACBr** já tem um perfil pronto pra Belo Horizonte — `github.com/frones/ACBr`, arquivo `Exemplos/ACBrDFe/ACBrNFSe/ArqINI/BHISS.ini`. É Delphi, não dá pra copiar código, mas mostra exatamente quais campos/quirks BH exige.
4. Se algo não bater com o que está documentado aqui, isso não é bloqueio — é você fazendo seu trabalho. Ajuste os passos seguintes com o dado real e documente a diferença no relatório final.

## PASSO 2 — Credenciais (pedir a Kleber, uma única vez)

Isso aqui NÃO dá pra automatizar via MCP — é um arquivo físico que só a Tornearia Castro possui. Peça a Kleber:
- **Inscrição Municipal** da Tornearia Castro em BH (número)
- **Arquivo `.pfx`** do certificado digital e-CNPJ (A1)
- **Senha** do certificado

Oriente Kleber a enviar o `.pfx` como anexo de arquivo (nunca pedir pra ele colar conteúdo binário como texto no chat).

## PASSO 3 — Armazenar como segredo

Nunca commitar. Nunca prefixo `NEXT_PUBLIC_*` (o certificado e a senha não podem chegar ao navegador). Variáveis:

```
NFSE_BH_INSCRICAO_MUNICIPAL=<recebido de Kleber>
NFSE_BH_CERTIFICADO_PFX_BASE64=<arquivo .pfx convertido pra base64>
NFSE_BH_CERTIFICADO_SENHA=<senha recebida de Kleber>
NFSE_BH_WSDL_URL=https://bhisshomologa.pbh.gov.br/bhiss-ws/nfse?wsdl
```

`NFSE_BH_WSDL_URL` começa apontando pra **homologação** — só troca pra produção depois do Passo 7 aprovado por Kleber. Adicionar ao `.env.local` (confirmar que está no `.gitignore`) e às env vars do projeto Vercel (`telascastroclaudia@gmail.com`) — ambiente de produção separado do de preview, já que homologação não deve nunca rodar sem querer com URL de produção.

## PASSO 4 — Dependências

```bash
npm install xml-crypto node-forge fast-xml-parser
```
- `xml-crypto`: assinatura XMLDSig do XML do RPS/lote
- `node-forge`: extrair chave privada + certificado do `.pfx` (formato PKCS#12) e montar o agente HTTPS com autenticação mútua (mTLS) — o certificado é exigido tanto na camada de transporte quanto na assinatura do XML, são dois usos diferentes do mesmo arquivo, não confundir
- `fast-xml-parser`: parsear a resposta SOAP/XML da prefeitura (sucesso ou erro) sem depender de um XSD gigante

Não instale uma lib de "SOAP client" genérica de terceiros sem antes checar se ela suporta certificado cliente customizado — muitas não suportam bem. Se necessário, montar o envelope SOAP manualmente com `fetch`/`https.Agent({ pfx, passphrase })` é mais previsível aqui do que depender de abstração de lib.

## PASSO 5 — Numeração sequencial de RPS (migration nova)

ABRASF exige RPS com numeração sequencial, sem furos nem repetição, por série. Criar `supabase/migrations/0003_nfse_rps_sequencial.sql`:

```sql
create sequence if not exists nfse_rps_sequencial start 1 increment 1;
```

Usar `nextval('nfse_rps_sequencial')` no momento de montar o RPS — nunca gerar o número em memória no Node (concorrência entre duas emissões simultâneas causaria RPS duplicado, e a prefeitura rejeita ou pior, aceita errado). Persistir o número do RPS usado em `notas_fiscais` (ou coluna nova, se fizer sentido) **antes** de enviar a chamada SOAP — assim, se a chamada falhar no meio do caminho, você sabe que aquele número já foi consumido e não tenta reusá-lo.

## PASSO 6 — Implementar `BhissNfseService`

Arquivo novo: `src/lib/services/nfse/bhiss-nfse-service.ts`, implementando `NfseService` (mesma interface do mock, não mude a UI nem o schema).

- `emitir()`: monta XML do RPS com os dados de `EmissaoNfseRequest` + inscrição municipal + número de RPS sequencial → assina com XMLDSig usando a chave extraída do `.pfx` → envia via SOAP (mTLS) pra `NFSE_BH_WSDL_URL` → parseia a resposta → devolve `EmissaoNfseResult` preenchido (em caso de erro do webservice, `status: "erro"` com `mensagemErro` legível, nunca deixe a Server Action estourar exceção genérica pro usuário)
- `consultarStatus()` e `cancelar()`: mesma lógica, usando as operações SOAP correspondentes confirmadas no Passo 1
- Trocar o import em `src/app/(app)/notas-fiscais/actions.ts`: de `mock-nfse-service` pra `bhiss-nfse-service`. Nada mais nesse arquivo deveria precisar mudar — a Server Action já grava em `notas_fiscais` do jeito certo.

## PASSO 7 — Testar em homologação (obrigatório antes de qualquer coisa em produção)

- Emitir uma NFS-e de teste a partir de uma transação real marcada como paga, com `NFSE_BH_WSDL_URL` apontando pra homologação
- Confirmar número, código de verificação e link do PDF retornados batem com o painel de homologação da prefeitura
- Testar `consultarStatus()` e `cancelar()`
- Forçar um cenário de erro (ex: XML com campo inválido de propósito) e confirmar que a UI mostra mensagem legível, sem crash
- **Não trocar `NFSE_BH_WSDL_URL` pra produção sem aprovação explícita de Kleber** — isso emite nota fiscal de verdade, com efeito legal real

### Critério de Aceitação
`npm run build` sem erros. NFS-e de teste emitida com sucesso em homologação, persistida em `notas_fiscais`, visível na aba Notas Fiscais. Cancelamento testado. Erro proposital tratado sem crash.

### Em caso de erro
Erro de resposta do webservice (SOAP Fault) = documentar a mensagem exata da prefeitura, não é bug seu — pode ser dado incorreto (inscrição municipal, alíquota) ou campo faltando no XML. Erro de assinatura/certificado (`.pfx` inválido, senha errada) = 🔴 Terminal, parar e reportar a Hades — não adivinhar a senha nem gerar novo certificado sem Kleber. Após 2 tentativas sem sucesso no mesmo problema, escalar pro Hades com o Protocolo de RCA.

## PASSO 8 — Relatório obrigatório

Formato padrão do Hades (STATUS / STEPS EXECUTADOS / OUTPUT DO TERMINAL / ESTADO ATUAL / ERROS ENCONTRADOS), incluindo explicitamente: qual versão de layout ABRASF foi confirmada no Passo 1, e se ela bateu com o que este plano presumiu.

---

# Plano de Tarefas — FASE 02.5: PORTAL DO ORÇAMENTO (compartilhamento, aprovação e conversão)

## Contexto

Spec da Shiva em `docs/memoria/projeto.md` (seção "Funcionalidade Adicional: Compartilhamento e Aprovação de Orçamento") e `docs/memoria/moscow.md` (adendo). Aprovada por Kleber, incluindo a ordem de execução (entra agora, entre a Fase 02 travada e a Fase 03) e a regra de que aprovar/recusar/converter é ação exclusiva de `administrador`.

**Decisão de arquitetura (Hades):** hoje TODA rota do sistema exige login (`src/proxy.ts`) e toda leitura passa por RLS (`supabase/migrations/0002_roles.sql`, política `leitura_autenticados`). A rota pública de orçamento é a primeira exceção — e ela NÃO deve furar a RLS existente. Em vez de criar uma política `anon`, a página pública busca dados usando `createAdminClient()` (`src/lib/supabase/admin.ts`, já existe, usa `service_role key`, ignora RLS por natureza) e valida o acesso **na aplicação**, comparando o token da URL com a coluna `token_compartilhamento`. RLS da tabela `ordens_servico` não muda em nada.

Verificado nesta sessão (protocolo de memória cética, não presumido):
- Já existe `src/lib/supabase/admin.ts` com `createAdminClient()` — reaproveitar, não recriar.
- Já existe `getSessao()`/`isAdmin` em `src/lib/auth/session.ts` — reaproveitar para travar as ações administrativas.
- **Não existe** página de detalhe de OS (`src/app/(app)/ordens-servico/[id]/page.tsx`) — só lista + dialog. Precisa ser criada; use `src/app/(app)/clientes/[id]/page.tsx` como referência de padrão (Server Component, `notFound()` se não achar, cards com `shadcn/ui`).
- **Não existe** `getOrdemServico(id)` em `src/lib/data/ordens-servico.ts` — só `listOrdensServico()` e `listOrdensServicoPorCliente()`. Siga o padrão de `getCliente(id)` em `src/lib/data/clientes.ts` (`.eq("id", id).maybeSingle()`).

## Pré-condições
- [ ] Nenhum bloqueio — não depende da Fase 02 (NFS-e) nem de credencial nova.

## PASSO 1 — Migration `0004_portal_orcamento.sql`

```sql
alter table ordens_servico
  add column token_compartilhamento uuid not null default gen_random_uuid() unique,
  add column aprovado_em timestamptz,
  add column recusado_em timestamptz,
  add column link_expira_em timestamptz;
```

Sem alteração de RLS — nenhuma política nova, nenhum acesso `anon`. `token_compartilhamento` já nasce preenchido (random, 122 bits — não é adivinhável), mas o link só é considerado válido depois que `link_expira_em` é setado (Passo 4) e enquanto `now() < link_expira_em`.

## PASSO 2 — `getOrdemServico(id)` em `src/lib/data/ordens-servico.ts`
Mesmo padrão de `getCliente`, reaproveitando `SELECT_ORDEM_SERVICO` e `toOrdemServico` já existentes no arquivo. Adicionar os 4 campos novos ao tipo `OrdemServico` (`src/lib/types/ordem-servico.ts`): `tokenCompartilhamento: string`, `aprovadoEm?: string`, `recusadoEm?: string`, `linkExpiraEm?: string`.

## PASSO 3 — Página de detalhe da OS: `src/app/(app)/ordens-servico/[id]/page.tsx`
Seguir o padrão visual de `clientes/[id]/page.tsx`: cabeçalho com número/cliente/status (`StatusBadge`), cards com itens de mão de obra e materiais, valor total (`calcularValorTotal`). Adicionar link/botão "Ver detalhes" na linha da tabela em `ordens-servico/page.tsx` apontando para essa rota (hoje a lista só abre o dialog de edição).

Nesta página, área de ações condicionais (só renderiza para `isAdmin` — usar `getSessao()`):
- OS sem `aprovado_em` e sem `recusado_em`: botão **"Compartilhar orçamento"** → chama a Server Action do Passo 4, mostra o link gerado (copiável) e um botão/link `wa.me` com a mensagem pronta.
- OS com `aprovado_em` preenchido e `status === "orcado"`: botão **"Converter em Serviço"** → Server Action do Passo 5.
- Mostrar visualmente `aprovado_em`/`recusado_em` quando existirem (ex: badge "Aprovado pelo cliente em dd/mm/yyyy").
- Quando `aprovado_em` estiver preenchido, o dialog de edição de itens (`ordem-servico-form-dialog.tsx`) deve ficar desabilitado para essa OS (mostrar texto "Orçamento já aprovado pelo cliente — não é possível editar valores" no lugar do botão de editar). Não é preciso construir um fluxo de "reabrir orçamento" — fora de escopo desta fase.

## PASSO 4 — Server Action `compartilharOrcamento` em `src/app/(app)/ordens-servico/actions.ts`
- Exige `isAdmin` (mesmo padrão de `criarOrdemServico`).
- `update ordens_servico set link_expira_em = now() + interval '30 days' where id = $1` (usa o client autenticado normal — RLS já permite update de administrador via `atualizacao_administrador`).
- Retorna a URL pública montada como `${NEXT_PUBLIC_SITE_URL ou request origin}/orcamento/${tokenCompartilhamento}`. Se não existir uma env var de URL base do site ainda, adicionar `NEXT_PUBLIC_SITE_URL` (produção: `https://tornearia-castro.vercel.app`) — não deduza a URL a partir de headers do request em Server Action (não é confiável).
- Cada clique em "Compartilhar" **renova** os 30 dias (comportamento simples e prático — não crie um segundo botão de "renovar link").

## PASSO 5 — Server Action `converterEmServico` em `src/app/(app)/ordens-servico/actions.ts`
- Exige `isAdmin`.
- Só executa se, ao reconsultar a OS, `aprovado_em` não for nulo e `status === "orcado"` — senão retorna erro `"Orçamento ainda não foi aprovado pelo cliente."`. Não confie em estado vindo do client.
- `update ordens_servico set status = 'em_execucao' where id = $1`.
- `revalidatePath` na página de detalhe e na lista.

## PASSO 6 — Rota pública `src/app/orcamento/[token]/page.tsx`
Fora do grupo `(app)` (sem sidebar/menu autenticado — é uma página para o cliente final, fora do CRM). Server Component:
1. Busca a OS via `createAdminClient()`, filtrando por `token_compartilhamento = params.token`.
2. Se não encontrar, ou `link_expira_em` for nulo/passado: renderizar estado "Link inválido ou expirado — peça um novo orçamento à Tornearia Castro." (sem vazar detalhe nenhum da OS).
3. Se `recusado_em` já preenchido: mostrar "Orçamento recusado em [data]" (somente leitura, sem botões).
4. Se `aprovado_em` já preenchido: mostrar "Orçamento aprovado em [data]" + valor total (somente leitura, sem botões — evita aprovar duas vezes).
5. Caso contrário (pendente, dentro da validade): mostrar itens de mão de obra/materiais, valor total, nome da Tornearia Castro, e os botões **Aprovar** / **Recusar**.

Visual: reaproveitar os tokens de `src/app/globals.css` (Geist, paleta "industrial tech" já documentada em `docs/memoria/design-system.json`) — layout simples e profissional, não é tela de admin, é a "vitrine" que o cliente vê. Sem sidebar, sem menu do CRM.

## PASSO 7 — Server Actions públicas: `src/app/orcamento/[token]/actions.ts`
- `aprovarOrcamento(token)` e `recusarOrcamento(token)` — **sem checar sessão** (rota é pública de propósito), usam `createAdminClient()`.
- Antes de gravar, revalidar no servidor: token existe, `link_expira_em` no futuro, `aprovado_em` e `recusado_em` ainda nulos (idempotência — não deixe um duplo-clique aprovar duas vezes nem sobrescrever uma recusa já registrada).
- `aprovarOrcamento`: `update ordens_servico set aprovado_em = now() where token_compartilhamento = $1 and aprovado_em is null and recusado_em is null and link_expira_em > now()`.
- `recusarOrcamento`: mesma lógica, gravando `recusado_em`.
- `revalidatePath("/orcamento/" + token)`.

## PASSO 8 — Liberar a rota pública no proxy
Em `src/proxy.ts`, adicionar `/orcamento` à checagem `rotaPublica`:
```ts
const rotaPublica =
  request.nextUrl.pathname.startsWith("/login") ||
  request.nextUrl.pathname.startsWith("/definir-senha") ||
  request.nextUrl.pathname.startsWith("/orcamento");
```

## PASSO 9 — Botão de WhatsApp
No botão "Compartilhar orçamento" (Passo 3), montar um link `https://wa.me/55<telefone só dígitos>?text=<mensagem codificada com encodeURIComponent>` usando `cliente.telefone` (já existe em `Cliente`) e o link público gerado no Passo 4. Mensagem sugerida: `"Olá {nome do cliente}! Segue o orçamento da Tornearia Castro: {link}"`. Abrir em nova aba (`target="_blank"`). Sem custo, sem lib nova, sem API do WhatsApp.

### Critério de Aceitação
`npm run build` sem erros. Fluxo completo testável manualmente: abrir uma OS em `orcado` → "Compartilhar orçamento" gera link → abrir o link **em aba anônima/deslogada** mostra o orçamento somente-leitura → clicar "Aprovar" trava a página e grava a data → voltar ao CRM logado, a OS mostra "Aprovado" e o botão "Converter em Serviço" aparece → clicar converte o status para `em_execucao`. Testar também: link expirado (forçar `link_expira_em` no passado via SQL) mostra a mensagem de link inválido, sem vazar dado.

### Em caso de erro
Erro de RLS/permissão ao gravar aprovação pública = 🔴 Terminal, provavelmente a rota pública está usando o client errado (`createClient()` autenticado em vez de `createAdminClient()`) — reportar a Hades com a mensagem exata, não tentar contornar abrindo política `anon`. Após 2 tentativas sem sucesso, escalar com Protocolo de RCA.

### Relatório obrigatório
Formato padrão do Hades. Incluir explicitamente: confirmação de que nenhuma política de RLS nova foi criada, e o resultado do teste em aba anônima (com print ou output do Playwright, se disponível).

---

# Plano de Tarefas — PATCH DE SEGURANÇA: Next.js 16.3.2 → 16.3.4

## Contexto
Kerberos encontrou, auditando a Fase 02.5, duas vulnerabilidades CRÍTICAS no Next.js 16.3.2 (`npm audit`): uma exclusiva de hospedagem Windows (não afeta a Vercel/Linux de produção) e outra — RCE não-autenticada via Image Optimization com arquivo AVIF malicioso — que **afeta qualquer hospedagem**, incluindo Vercel, e o endpoint (`/_next/image`) está confirmadamente ativo mesmo sem o app usar `<Image>` em nenhuma tela ainda. Patch corrigido: `15.5.24` / `16.3.3`. Decisão (Hades): não vale a pena atrasar por causa de patch de versão — é upgrade de patch, risco baixíssimo de quebrar algo, e não tem NENHUMA dependência com a Fase 02.5. As duas coisas vão juntas pro mesmo ciclo de `hml` (ver seção final), mas em commits separados — rastreabilidade importa.

## Passos
1. `npm install next@16.3.4`
2. `npx tsc --noEmit` — zero erros esperado
3. `npm run build` — build limpo esperado
4. Commit isolado: `fix: atualiza Next.js para corrigir RCE critica em Image Optimization (CVE)`, sem misturar com arquivos da Fase 02.5
5. Push para `dev`

### Critério de Aceitação
Build e typecheck limpos. `npm audit --audit-level=critical` sem mais entradas de Next.js.

### Em caso de erro
Se o upgrade quebrar algo (breaking change inesperado de patch, incomum mas possível), parar e reportar a Hades antes de tentar contornar — não fazer downgrade silencioso.

---

## Promoção conjunta `dev → hml`

Depois do patch commitado e da Fase 02.5 já commitada (ambas já estão em `dev`), Atlas segue o Protocolo de Backup e Merge padrão (tag `backup-pre-hml-*`, build/testes, aguardar confirmação explícita de Kleber) e promove **as duas coisas juntas** num único merge `dev → hml` — não há motivo pra gastar dois ciclos de backup/verificação em mudanças que já estão prontas ao mesmo tempo.

Pendência que NÃO bloqueia esse merge: Kleber ainda não fez a checagem manual dos botões "Compartilhar orçamento" / "Converter em Serviço" (ver relatório da Ravena — ela não pôde testar essa parte por não digitar senha de login). Recomendação: fazer essa checagem já em `hml` depois do merge — é literalmente o ambiente feito pra isso.

---
---

# Plano de Tarefas — FASE 02.6: VALOR FECHADO NO ORÇAMENTO

## Contexto

Spec da Shiva em `docs/memoria/projeto.md` (seção "Funcionalidade Adicional: Valor Fechado no Orçamento") e `docs/memoria/moscow.md` (adendo de 2026-09-10). Aprovada por Kleber, incluindo a decisão de o cliente ver as linhas do bloco Serviço mas **nunca** mão de obra e materiais.

Origem: Kleber escreveu "Valor do serviço R$800,00" dentro do campo de descrição da OS-2026-0003 porque não existe onde lançar preço fechado. O total ficou R$ 0,00. Não é bug — é lacuna de produto.

## Verificações feitas nesta sessão (não presumidas — protocolo de memória cética)

O ponto crítico desta fase é que **o valor total da OS é recalculado em três lugares diferentes, cada um com sua própria cópia da fórmula**. Confirmado por leitura direta:

| Onde | Arquivo / linha | Como calcula hoje |
|---|---|---|
| Helper oficial | `src/lib/types/ordem-servico.ts:51-61` | `calcularValorMaoDeObra` + `calcularValorMateriais` |
| Página pública | `src/app/orcamento/[token]/page.tsx:69-74` | fórmula duplicada, inline |
| Conta a receber | `src/app/(app)/ordens-servico/actions.ts:313-317` | fórmula duplicada, inline |

Consumidores do helper (esses ficam certos de graça se o helper for corrigido):
- `src/app/(app)/ordens-servico/[id]/page.tsx:69` — card "Valor total"
- `src/app/(app)/ordens-servico/page.tsx:109` — coluna Valor da listagem
- `src/app/(app)/clientes/[id]/page.tsx:136` — OS na ficha do cliente

**Correção factual à spec da Shiva:** ela lista o Dashboard como impactado. Não é — `src/app/(app)/dashboard/page.tsx` usa `listOrdensServico()` apenas para a distribuição de status (`getStatusOsDistribuicao`); os valores do Dashboard vêm de `transacoes_financeiras`. Nenhuma alteração lá.

**Sobre a NFS-e:** ela também não precisa de mudança direta. A nota é emitida a partir de uma transação **paga** do Financeiro, e o valor dessa transação vem da conta a receber gerada em `gerarContaAReceber`. Corrigindo a fórmula lá, a nota sai certa por consequência. Se ficasse de fora, a Prefeitura receberia um valor diferente do que apareceu na tela — que é exatamente o tipo de erro que só se descobre depois de emitida.

Padrões já existentes a reaproveitar (não recriar):
- Tabelas de itens: `itens_mao_de_obra` / `itens_materiais` (`supabase/migrations/0001_init.sql:30-45`) — `on delete cascade`, `numeric`, sem `created_at`.
- RLS por papel: 4 políticas por tabela em `supabase/migrations/0002_roles.sql:30-38` — leitura para autenticado, escrita/atualização/exclusão só via `public.is_administrador()`.
- Server Actions de item: `adicionarMaoDeObra` / `adicionarMaterial` / `removerItem` (`src/app/(app)/ordens-servico/actions.ts:157-237`) — checam `isAdmin`, convertem vírgula com `.replace(",", ".")`, chamam `garantirEdicaoPermitida` (trava pós-aprovação) e `revalidarOrdem`.
- UI de lançamento: `src/app/(app)/ordens-servico/[id]/itens-lancamentos.tsx` — dois blocos idênticos em estrutura; o terceiro é cópia do bloco de Materiais.

## Pré-condições
- [ ] `git checkout dev && git pull origin dev`
- [ ] Nenhuma credencial nova. Nenhum custo novo. Nenhuma dependência nova.

---

## PASSO 1 — Migration `supabase/migrations/0006_itens_servico.sql`

```sql
-- Preco fechado: o que o cliente compra, sem abrir a formacao de preco.
-- Mesmo padrao de itens_materiais (quantidade x valor unitario).
create table itens_servico (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references ordens_servico(id) on delete cascade,
  descricao text not null,
  quantidade numeric not null,
  valor_unitario numeric not null
);

alter table itens_servico enable row level security;

create policy "leitura_autenticados" on itens_servico for select to authenticated using (true);
create policy "escrita_administrador" on itens_servico for insert to authenticated with check (public.is_administrador());
create policy "atualizacao_administrador" on itens_servico for update to authenticated using (public.is_administrador()) with check (public.is_administrador());
create policy "exclusao_administrador" on itens_servico for delete to authenticated using (public.is_administrador());
```

Sem coluna `unidade` — de propósito. Materiais precisam de unidade (kg, m, un) porque são medidos; serviço fechado é contado em peças. Um campo a menos para Kleber preencher no caso mais comum.

**Aplicação:** Supabase MCP não está conectado nesta sessão. Mesmo caminho das migrations 0001–0005: Atlas entrega o SQL pronto e Kleber cola no SQL Editor do Supabase (conta `telascastroclaudia@gmail.com`). Atlas confirma depois via consulta REST real à tabela — **não** aceita "apliquei" como prova.

---

## PASSO 2 — Tipo e cálculo em `src/lib/types/ordem-servico.ts`

```ts
export interface ItemServico {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}
```

- Adicionar `servicos: ItemServico[]` à interface `OrdemServico`.
- Criar `calcularValorServicos(os: Pick<OrdemServico, "servicos">)` no mesmo formato dos outros dois.
- **Alterar `calcularValorTotal`** para somar os três: `Pick<OrdemServico, "servicos" | "maoDeObra" | "materiais">`.

O TypeScript vai apontar sozinho qualquer lugar que construa um `OrdemServico` sem o campo novo. Isso é proposital — é a rede de segurança contra esquecer um consumidor.

Exportar `ItemServico` e `calcularValorServicos` no barrel `src/lib/types` (mesmo lugar de onde `ItemMaterial` já sai).

---

## PASSO 3 — Camada de dados em `src/lib/data/ordens-servico.ts`

- `SELECT_ORDEM_SERVICO` (linha 63) passa a incluir `itens_servico(*)`.
- `OrdemServicoRow` ganha `itens_servico: { id: string; descricao: string; quantidade: number; valor_unitario: number }[]`.
- `toOrdemServico` mapeia `valor_unitario → valorUnitario`, igual já faz com materiais.

As três funções do arquivo (`listOrdensServico`, `listOrdensServicoPorCliente`, `getOrdemServico`) usam a mesma constante — corrigir num lugar resolve os três.

---

## PASSO 4 — Server Actions em `src/app/(app)/ordens-servico/actions.ts`

**4.1 — `adicionarServico(ordemServicoId, formData)`**

Cópia estrutural de `adicionarMaterial` (linha 185), sem o campo `unidade`:
- `isAdmin` obrigatório → `"Consultores não podem lançar valores."`
- Campos: `descricao` (texto, obrigatório), `quantidade` e `valorUnitario` (`Number(String(...).replace(",", "."))`, ambos `> 0` e finitos)
- Mensagens de erro: `"Descreva o serviço."` / `"Informe a quantidade."` / `"Informe o valor unitário."`
- `garantirEdicaoPermitida` antes do insert — a trava pós-aprovação vale igual
- `insert` em `itens_servico`, depois `revalidarOrdem(ordemServicoId)`

**4.2 — `removerItem` (linha 215)**

O parâmetro `tipo` hoje é `"mao_de_obra" | "material"`. Adicionar `"servico"` e mapear para a tabela `itens_servico`. Manter a checagem de `isAdmin` e `garantirEdicaoPermitida` como está.

**4.3 — ⚠️ `gerarContaAReceber` (linha 292) — o ponto mais perigoso da fase**

O `select` da linha 307 precisa passar a trazer `itens_servico(quantidade, valor_unitario)`, e a soma das linhas 315-317 precisa incluir esse terceiro termo.

Se este passo for esquecido, o sistema mostra R$ 800,00 na tela e gera uma cobrança de R$ 0,00 — e como `valor <= 0` faz a função retornar sem criar nada (linha 319), a OS seria faturada **sem nenhuma conta a receber**, sem erro, sem aviso. A NFS-e viria junto no prejuízo, porque a nota nasce dessa transação.

---

## PASSO 5 — UI: bloco Serviço em `src/app/(app)/ordens-servico/[id]/itens-lancamentos.tsx`

- Nova prop `servicos: ItemServico[]`, passada pela página (`page.tsx` linha 84-89: `servicos={os.servicos}`).
- Novo bloco **acima** de "Mão de obra" (é o caminho mais comum — o que se usa mais vem primeiro). O bloco de Mão de obra ganha a borda superior (`border-t pt-6`) que hoje só o de Materiais tem.
- Título: **Serviço**. Colunas: `Descrição · Qtd. · Valor unitário · Subtotal` (+ lixeira quando `podeEditar`).
- Formulário: `grid gap-3 sm:grid-cols-[1fr_6rem_9rem_auto]`, `noValidate`, `ref` própria com `reset()` no sucesso, mesmo tratamento de `toast`/`setErro`.
- Vazio: `"Nenhum serviço lançado."`
- Placeholders: `Ex: Usinagem de bucha` · `1` · `800,00`.
- Toast de sucesso: `"Serviço lançado."`

**Melhoria pedida pela spec (Should Have, mas é uma linha):** acima dos três blocos, um texto curto explicando o que ficou implícito na tela e derrubou Kleber:

> *Lance o preço fechado em **Serviço**, ou abra em **Mão de obra** e **Materiais**. Pode usar os dois. Os números em cinza são só exemplos — o valor total é a soma do que você lançar.*

---

## PASSO 6 — Página pública `src/app/orcamento/[token]/page.tsx` (mudança de comportamento + segurança)

Esta é a parte que muda o que o cliente enxerga. **Não basta esconder na tela.**

- No `select` da linha 24: **remover** `itens_mao_de_obra(...)` e `itens_materiais(...)`; **adicionar** `itens_servico(descricao, quantidade, valor_unitario)`.
- Como o valor total precisa incluir mão de obra e materiais (que não podem ser enviados ao browser), fazer uma **segunda consulta no servidor** só para somar — traga os campos, calcule, e coloque apenas o número no objeto retornado por `buscarOrcamentoPorToken`. Os itens brutos não entram no retorno.
  - Alternativa aceitável e mais limpa, se Atlas preferir: uma função `calcularTotalOrdemServico(supabase, ordemServicoId)` em `src/lib/data/ordens-servico.ts`, usada tanto aqui quanto em `gerarContaAReceber` — mata as duas cópias da fórmula de uma vez. **Preferir esta.**
- Remover as duas `<Table>` de mão de obra e materiais (linhas 86-132). Colocar no lugar **uma** tabela com os itens de serviço: `Descrição · Qtd. · Valor` (valor = `quantidade × valor_unitario`), renderizada só quando houver itens.
- O bloco "Valor total" (linhas 134-137) continua igual, agora lendo o total já calculado no servidor.
- Interface `OrcamentoPublico`: trocar `maoDeObra`/`materiais` por `servicos` e `valorTotal`.

**Critério de verificação (Kerberos vai checar isso):** abrir o HTML servido da página pública de uma OS que tenha mão de obra lançada e confirmar que **nenhuma** hora, valor/hora ou material aparece no payload — nem no HTML, nem no payload de hidratação do React. Esconder com CSS ou `hidden` é reprovado.

---

## PASSO 7 — Manual do sistema

`docs/manual-do-sistema.html`, seção **05 — "Lançar os valores"** (a partir da linha ~976):
- Acrescentar o bloco **Serviço** no roteiro, antes de Mão de obra, com o exemplo de lote (`5 buchas × R$ 160,00`).
- Aviso novo, no padrão `<div class="nota">` já usado no arquivo: os números em cinza dentro dos campos são **exemplos**, não valores preenchidos.
- Nota de que **vírgula funciona** (`120,50`) — verificado em `actions.ts`, o sistema converte.
- Na seção que descreve o link do cliente: o cliente vê a descrição, as linhas de **Serviço** e o total — mão de obra e materiais são internos.
- O `.pdf` é gerado a partir do `.html`; se Atlas não tiver como regerar sem instalar nada, deixar o `.pdf` desatualizado e **reportar**, não improvisar ferramenta nova.

**Versionar os dois arquivos** (`docs/manual-do-sistema.html` e `.pdf`) — hoje estão como untracked no `git status`, fora do histórico. Commit separado, mensagem `docs: versiona manual do sistema`.

---

## Critério de Aceitação

- [ ] `npm run build` e `npx tsc --noEmit` limpos
- [ ] Migration aplicada por Kleber e **confirmada por consulta real** à tabela `itens_servico` (não por relato)
- [ ] Numa OS de teste: lançar `Bucha · 5 · 160,00` → tabela mostra subtotal R$ 800,00 e o card "Valor total" mostra R$ 800,00
- [ ] Lançar também `Aço 1045 · 2 un · 60,00` em Materiais → total vira R$ 920,00 (os blocos somam juntos, não se excluem)
- [ ] Coluna Valor na listagem de OS e na ficha do cliente mostram R$ 920,00 — o mesmo número
- [ ] Página pública dessa OS: mostra a linha `Bucha · 5 · R$ 800,00` e o total R$ 920,00; **não** mostra nada de mão de obra nem materiais, e esses dados **não estão** no HTML servido
- [ ] Levar a OS até **Faturado** → conta a receber criada no Financeiro com **R$ 920,00** (este é o teste que prova o Passo 4.3)
- [ ] Com o cliente tendo aprovado (`aprovado_em` preenchido), os três formulários de lançamento somem — inclusive o novo
- [ ] Dados de teste removidos do banco ao final e a OS usada restaurada ao estado original

## Em caso de erro
Parar e reportar a Hades com o output completo do terminal — sem resumir, sem contornar. Regra das 2 tentativas vale.

## Relatório obrigatório ao concluir
- **STATUS**: sucesso / erro
- **STEPS EXECUTADOS**: lista numerada
- **OUTPUT DO TERMINAL**: `npm run build`, `npx tsc --noEmit`, comandos git — sem resumir
- **ESTADO ATUAL**: `git status` + `git log --oneline -3`
- **ERROS ENCONTRADOS**: mensagem exata, se houver
- **EVIDÊNCIA DO CRITÉRIO DE ACEITAÇÃO**: como cada item foi verificado — especialmente o valor da conta a receber e a ausência de mão de obra no HTML público

## GitFlow
Atlas trabalha em `dev`. Commits separados: (1) feature, (2) manual. Nada de merge para `hml` ou `main` sem aprovação explícita de Kleber + backup por tag.

---
---

# TAREFA AVULSA — LIMPEZA DAS OS DE TESTE (2026-09-10)

## Contexto

Kleber pediu a remoção das 4 ordens de serviço de teste que estão no banco de produção. Não é uma fase de produto — é limpeza de dado. **Nenhuma linha de código muda.** Não há commit, não há build, não há deploy.

As 4 OS (todas em status `orcado`, todas do cliente Kleber Pereira, todas R$ 0,00):

| Número | Descrição | Abertura |
|---|---|---|
| OS-2026-0001 | Teste XPTO | 09/09/2026 |
| OS-2026-0002 | Usinagem Eixo XPTO | 09/09/2026 |
| OS-2026-0003 | Usinagem Kleber Pereira XPTO. Valor do serviço R$800,00 | 09/09/2026 |
| OS-2026-0004 | Teste... | 10/09/2026 |

## Verificações feitas nesta sessão (não presumidas — protocolo de memória cética)

**1. Não existe função de exclusão de OS no sistema.** Conferido em `src/app/(app)/ordens-servico/actions.ts` — as exportações são `criarOrdemServico`, `compartilharOrcamento`, `converterEmServico`, `adicionarServico`, `adicionarMaoDeObra`, `adicionarMaterial`, `removerItem`, `avancarStatus`, `editarOrdemServico`. `removerItem` remove **lançamentos dentro** de uma OS, não a OS. Kleber confirmou que procurou o botão e não achou — ele está certo, o botão não existe. Por isso a limpeza é via SQL, não via UI.

**2. Existe "Cancelar OS"** (`src/app/(app)/ordens-servico/[id]/status-acoes.tsx:100`), transição `orcado → cancelado` permitida (`TRANSICOES_PERMITIDAS`, linha 280). Mas cancelar mantém a OS na lista. Kleber decidiu apagar de fato, não cancelar.

**3. ⚠️ A numeração é frágil — leia antes de apagar.**
`proximoNumero` (`actions.ts:13-21`) gera o número **contando as OS do ano e somando 1**:
```ts
const sequencial = String((count ?? 0) + 1).padStart(4, "0");
```
Consequência: apagar **todas as 4** é seguro (contagem volta a 0, a próxima OS real nasce `OS-2026-0001`). Apagar **apenas algumas** quebra o sistema — a contagem passa a gerar um `numero` que já existe e a constraint `unique` derruba a criação da próxima OS com o erro genérico `"Não foi possível criar a ordem de serviço."`.
**Portanto: apagar as 4, ou nenhuma. Nunca um subconjunto.**

**4. Dependências que podem bloquear o DELETE:** em `supabase/migrations/0001_init.sql`, `itens_mao_de_obra` e `itens_materiais` têm `on delete cascade` (somem junto, sem esforço) — e `itens_servico` também (`0006_itens_servico.sql`). Mas `transacoes_financeiras.ordem_servico_id` e `notas_fiscais.ordem_servico_id` **não têm cascade** — se houver qualquer registro apontando para essas OS, o DELETE falha com erro de foreign key. Isso é uma rede de proteção, não um bug: significa que o banco se recusa a apagar uma OS que já virou dinheiro ou nota fiscal. Não contorne com `cascade`.

Kleber afirmou que as 4 estão vazias (o R$ 0,00 na tela é consistente com isso), mas **confirme no PASSO 2 antes de apagar** — apagar não tem desfazer.

## Pré-condições
- [ ] Nenhuma. Não depende de código, branch, build ou credencial nova.

## PASSO 1 — Conferir o que existe (rodar antes de qualquer coisa)

```sql
select numero, status, descricao_servico, data_abertura
from ordens_servico
where numero in ('OS-2026-0001','OS-2026-0002','OS-2026-0003','OS-2026-0004')
order by numero;
```
Esperado: exatamente 4 linhas, todas `orcado`. Se vier número diferente de 4, ou alguma com status diferente de `orcado`, **PARAR e reportar** — o banco não está no estado que este plano presume.

## PASSO 2 — Conferir o que está pendurado nelas

```sql
with alvo as (
  select id from ordens_servico
  where numero in ('OS-2026-0001','OS-2026-0002','OS-2026-0003','OS-2026-0004')
)
select 'itens_servico'          as tabela, count(*) from itens_servico          where ordem_servico_id in (select id from alvo)
union all
select 'itens_mao_de_obra',           count(*) from itens_mao_de_obra           where ordem_servico_id in (select id from alvo)
union all
select 'itens_materiais',             count(*) from itens_materiais             where ordem_servico_id in (select id from alvo)
union all
select 'transacoes_financeiras',      count(*) from transacoes_financeiras      where ordem_servico_id in (select id from alvo)
union all
select 'notas_fiscais',               count(*) from notas_fiscais               where ordem_servico_id in (select id from alvo);
```

- Itens (`itens_servico` / `itens_mao_de_obra` / `itens_materiais`) com contagem > 0: **ok**, somem em cascata junto com a OS.
- `transacoes_financeiras` ou `notas_fiscais` com contagem > 0: 🔴 **PARAR e reportar a Kleber antes de apagar.** Isso significa que uma dessas "OS de teste" gerou movimento financeiro ou nota fiscal — apagar destruiria histórico contábil. Não force, não use `cascade`, não delete a transação junto por conta própria.

## PASSO 3 — Apagar (só se o PASSO 2 estiver limpo)

```sql
delete from ordens_servico
where numero in ('OS-2026-0001','OS-2026-0002','OS-2026-0003','OS-2026-0004');
```

Listar os números explicitamente. **Nunca** `delete from ordens_servico` sem `where`, nem filtrar por `descricao_servico ilike '%teste%'` — descrição é texto livre e uma OS real pode conter a palavra.

## PASSO 4 — Confirmar por consulta real (não por relato)

```sql
select count(*) as total_os from ordens_servico;
```
Esperado: `0`.

Depois, Kleber recarrega `/ordens-servico` no navegador e confirma: "0 ordens registradas", tabela vazia, todos os cards de status zerados.

## PASSO 5 — Teste da numeração (importante, não pular)

Depois da limpeza, criar **uma** OS de verdade (ou de teste, e apagá-la de novo pelo mesmo processo) e confirmar que ela nasce como **`OS-2026-0001`**. Isso prova que a numeração se recompôs e que a próxima OS real do Kleber não vai bater em erro.

## Aplicação
Supabase MCP não está conectado nesta sessão (mesma situação das migrations 0001–0006). Atlas entrega o SQL pronto e Kleber cola no SQL Editor do Supabase (conta `telascastroclaudia@gmail.com`), um passo de cada vez, colando o resultado de volta. Atlas **não** aceita "apliquei" como prova — confirma pelo resultado do PASSO 4.

## Critério de Aceitação
- [ ] PASSO 2 executado e resultado registrado **antes** de qualquer `delete`
- [ ] `select count(*) from ordens_servico` retorna `0`
- [ ] Tela `/ordens-servico` mostra "0 ordens registradas"
- [ ] Próxima OS criada nasce como `OS-2026-0001`

## Em caso de erro
Erro de foreign key (`violates foreign key constraint`) = 🔴 Terminal. Significa que existe transação financeira ou nota fiscal ligada à OS. **Parar, reportar a Kleber com a mensagem exata**, não contornar.

## GitFlow
Nenhum commit de código. O único arquivo alterado é este plano (documentação) — commit `docs: registra tarefa de limpeza das OS de teste`.

## Dívida técnica registrada (não executar agora — decisão de Kleber em 2026-09-10)
Kleber optou por **não** construir o botão "Excluir OS" nesta rodada. Fica anotado que o sistema não tem como apagar uma OS criada por engano, e que a numeração baseada em `count()` é frágil por natureza (o correto seria uma `sequence` no Postgres, igual já se fez com `nfse_rps_sequencial` na migration `0003`). Se a limpeza manual precisar acontecer uma terceira vez, isso vira fase de trabalho.
