# Plano de Tarefas

## ÍNDICE
- FASE 01: FUNDAÇÃO (concluída — ver seções abaixo)
- FASE 02: NFS-E REAL — BELO HORIZONTE (abaixo, no fim do arquivo)

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
