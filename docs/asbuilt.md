# Tornearia Castro — CRM

**Descrição:** Sistema interno de gestão da Tornearia Castro (clientes, ordens de serviço, financeiro), hoje um protótipo funcional sem persistência real. Objetivo: virar sistema de produção completo, sem faseamento de escopo (Kleber decidiu incluir tudo na v1).
**Stack:** GitHub + Supabase + Vercel + Next.js 16 (App Router) + shadcn/ui
**Última atualização:** 2026-09-10 (Fase 02.6 — Valor Fechado no Orçamento — **em produção**; Fases 01, 02, 02.5 e NFS-e real também em produção. NFS-e ligada e configurada — falta só emitir a primeira nota real, decisão de Kleber. Fase 03 pagamento não iniciada. Banco de produção limpo de dados de teste em 2026-09-10 — zero OS, zero transações, zero notas; 1 cliente real cadastrado)

---

## ⚠️ Bloqueios e Dívidas Conhecidas

> **Revisado em 2026-09-10.** A lista anterior era do primeiro dia do projeto (2026-08-26) e estava inteiramente obsoleta — dizia que não havia repositório git e que faltavam contas Vercel/Supabase, tudo resolvido há semanas. Substituída pelo estado real, verificado por consulta ao código e ao banco.

### Resolvido (mantido só para não ser re-investigado)
- ~~Não é repositório git~~ → repo ativo em `github.com/TorneariaCastro/TorneariaCastro`, GitFlow `dev`/`hml`/`main` funcionando.
- ~~Contas Vercel/Supabase separadas sem acesso~~ → projeto Vercel e Supabase criados na conta `telascastroclaudia@gmail.com`, credenciais em `.env.local` e nas env vars da Vercel.

### Ativo — limitações de ambiente
- **Sem Supabase MCP e sem GitHub MCP conectados.** Contornado sem custo: o Atlas opera o banco via REST API com a `service_role key` do `.env.local`, e o GitHub via `gh` CLI. Nenhuma tarefa ficou bloqueada por isso até hoje. Instalar os MCPs seria conveniência, não necessidade.

### Ativo — dívida técnica (não bloqueia, mas cobra juros)
- ✅ ~~`proximoNumero()` gera o número da OS contando linhas~~ — **corrigido e EM PRODUÇÃO desde 2026-09-10 (Fase 02.7)**. Substituído por contador no banco (`os_contador` + `public.proximo_numero_os()`, migration `0007`), incrementado numa única instrução atômica e consumido via `.rpc()`. Ver `docs/decisions/ADR-001-numeracao-de-ordens-de-servico.md`.

### Ativo — recomendações do Kerberos (não bloqueiam, pendentes)
- 🟢 **`revoke execute on function public.proximo_numero_os() from public;`** — o Postgres concede execução a todos por padrão ao criar uma função. A trava interna (`is_administrador()`) já bloqueia, comprovado por pentest com chave `anon` (401) e com consultor real (403). Isto é defesa em profundidade, não correção de falha.
- 🟡 **`nextval_nfse_rps_sequencial` (migration `0003`) não tem checagem de papel.** Qualquer usuário autenticado — consultor incluído — pode chamá-la e consumir números de RPS fiscal, criando furos na numeração que a Prefeitura acompanha. Hoje é teórico (os 2 usuários existentes são administradores), mas deixa de ser no dia em que houver um consultor. Achado fora do escopo da Fase 02.7, encontrado por comparação de padrões.
- 🟡 **Não existe função de exclusão de OS.** Só "Cancelar OS" (muda o status, mantém na lista). Uma OS criada por engano só sai do sistema por SQL manual. Kleber optou por não construir o botão em 2026-09-10 — decisão consciente, registrada aqui para não virar surpresa depois.
- 🟡 **`docs/manual-do-sistema.pdf` está desatualizado** em relação ao `.html` (o `.html` é a fonte, o `.pdf` é gerado a partir dele).
- 🟡 **Responsividade da Fase 02.6 nunca foi testada** — a Ravena ficou sem celular na sessão (rede de hóspedes bloqueou o dispositivo).

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

**Peça faltante encontrada e corrigida:** não existia tela de "definir senha" pra aceitar convite — criada em `src/app/(auth)/definir-senha/page.tsx` (commit `f78cdde`). Supabase URL Configuration já ajustado por Kleber.

**Repositório corrigido em 2026-08-26:** o Atlas tinha criado `TorneariaCastro/tornearia-castro` (nome errado, escolhido automaticamente). O repositório correto é `TorneariaCastro/TorneariaCastro` (já existia, vazio). Todo histórico (`main`/`dev`/`hml` + tags) migrado para lá via `git remote set-url` + push; projeto Vercel reconectado ao repo certo. **O repositório antigo (`tornearia-castro`, minúsculo) ainda existe no GitHub e não foi apagado** — aguardando confirmação de Kleber pra deletar.

✅ **Bloqueio de deploy resolvido em 2026-08-26:** Kleber optou por tornar o repositório público (opção gratuita) em vez de assinar o Vercel Pro. Histórico completo varrido por segurança antes da troca — zero secrets encontrados. Deploy de produção rodou limpo depois (`dpl_34WyVAQsvKqP7rnb4F65hdMzPDre`, `READY` em 21s). `https://tornearia-castro.vercel.app` agora serve a versão com a tela `/definir-senha`.

**E-mail de acesso reenviado:** o primeiro convite (`/auth/v1/invite`) já tinha criado o usuário `eusoukleberpereira@gmail.com`, então o reenvio precisou ser via `/auth/v1/recover` (link de recuperação de senha, mesmo efeito) apontando pra `https://tornearia-castro.vercel.app/definir-senha`. Aguardando Kleber clicar e confirmar que consegue entrar.

**Repositório errado apagado por Kleber em 2026-08-26** (`TorneariaCastro/tornearia-castro`, minúsculo) — confirmado via `gh repo view` (não existe mais). Único repositório ativo agora: `TorneariaCastro/TorneariaCastro`.

**Login de Kleber criado e testado em 2026-08-26:** senha definida via Admin API a pedido dele (`eusoukleberpereira@gmail.com`), autenticação confirmada direto contra a API do Supabase (token emitido com sucesso). Fase 01 encerrada de fato — sistema em produção, com dados reais e login funcional de ponta a ponta.

**Pós-Fase 01 — evoluções em 2026-08-26 (mesma sessão):**
- Aba **Notas Fiscais** — lista emissões reais (persistidas), botão "Emitir NFSe" no Financeiro agora grava no banco (emissão em si continua mock, Fase 02 troca por integração real)
- **Papéis de usuário** (`administrador` / `consultor`) — RLS no banco (leitura liberada, escrita só administrador), interface esconde ações de escrita para consultor, aba Usuários exclusiva de administrador. Criação de usuário mudou de "convite por e-mail" para "e-mail + senha + papel definidos na hora" (decisão de Kleber)
- **Bug corrigido:** menu de conta (avatar/e-mail no header) quebrava ao abrir — `DropdownMenuLabel` faltando `DropdownMenuGroup` (erro do Base UI, latente desde o protótipo original, nunca tinha sido clicado em produção). Corrigido e testado com Playwright (browser real) antes de pedir confirmação a Kleber.
- **Performance/robustez:** `getSessao()` deduplicada por requisição com `React.cache()` — evita 3 chamadas redundantes ao Supabase Auth por página carregada.

**Testável:** Login funcionando, CRUD real de Clientes/OS/Financeiro persistindo entre sessões, sistema acessível via URL da Vercel.
**Notas:** NFS-e e pagamento continuam mockados nesta fase — é intencional, entram nas fases seguintes.
**Último trabalho:** Ainda não iniciado.

---

### 🟠 FASE 02: NFS-E REAL (Belo Horizonte - MG)
**Status:** `✅ Ligada em produção` (2026-09-09 — código de tributação resolvido, serviço real conectado; falta só a primeira emissão real, que é decisão de negócio de Kleber, não trava técnica)
**Progresso:** 9/9 tarefas — integração completa em produção

> ⚠️ **Correção de registro (2026-09-10):** o cabeçalho abaixo ficou congelado no estado de 2026-09-08, quando o código de tributação ainda estava vazio. **Isso foi superado no dia seguinte.** Estado real, verificado no código em 2026-09-10:
> - `NFSE_BH_CODIGO_TRIB_NACIONAL=140501` configurado (confirmado por Kleber em 2026-09-09: "Restauração, recondicionamento, corte, recorte, acabamento, polimento e congêneres"), `opSimpNac=3`, `pTotTribSN=6`.
> - `src/app/(app)/notas-fiscais/actions.ts` importa `sefinNacionalNfseService` — o serviço **real**, não o mock.
> - Configuração gravada nas env vars da Vercel (produção), certificado e senha como `sensitive`.
> - O que falta: **emitir a primeira nota real** numa OS de verdade — decisão de Kleber, a máquina está pronta. Ver a entrada de 2026-09-09 no Histórico de Sessões para o detalhe dos 7 defeitos corrigidos.

<details><summary>Histórico do bloqueio antigo (2026-09-08, já superado) — mantido por rastreabilidade</summary>
**Objetivo:** Substituir `mock-nfse-service.ts` por integração real com o **Sistema Nacional de NFS-e (SEFIN Nacional/ADN)** — o webservice próprio da Prefeitura (BHISS Digital) foi **descontinuado**, migração nacional obrigatória desde 1/1/2026 (confirmado na página oficial da Prefeitura de BH).
**Por que agora?** Kleber classificou como "o principal" — mais urgente que pagamento.
**Por que a mudança de alvo?** O webservice BHISS Digital vinha respondendo 502 em toda tentativa (Passo 1 do plano original). Investigando o porquê, descobrimos que não era instabilidade — é o sistema antigo sendo desativado porque a legislação (Art. 62 da LC 214/2025) tornou o Emissor Nacional obrigatório para todos os prestadores de BH desde janeiro/2026.

**Pré-requisitos já confirmados por Kleber:** certificado digital e-CNPJ (A1, `.pfx`) e cadastro ativo de contribuinte do ISS em BH — continuam válidos, o certificado é o mesmo para o novo sistema.

#### Tarefas:
- [x] 1. Credenciais (Inscrição Municipal + `.pfx` + senha) — recebidas de Kleber e gravadas em `.env.local`
- [x] 2. Migration `supabase/migrations/0003_nfse_rps_sequencial.sql` — aplicada e verificada; reaproveitada para numerar a DPS
- [x] 3. Dependências — reaproveitadas (`xml-crypto`, `node-forge`); GZip via `node:zlib` nativo, sem lib nova
- [~] 4. `BhissNfseService` (`src/lib/services/nfse/bhiss-nfse-service.ts`) — corrigido contra referência ACBr (commit `2bee8af`), mas **descoberto obsoleto em seguida**: mantido no repo por histórico, não é mais o caminho ativo
- [x] 5. Descoberta da migração para o Emissor Nacional — pesquisa web confirmou across múltiplas fontes (página oficial da Prefeitura de BH, portal gov.br/nfse, relato técnico de outro desenvolvedor) que BHISS Digital foi substituído
- [x] 6. `SefinNacionalNfseService` (`src/lib/services/nfse/sefin-nacional-nfse-service.ts`) — estrutura da DPS **revalidada campo a campo** contra o `ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe-v1.01` oficial, baixado direto de gov.br/nfse (a Swagger UI do site é uma SPA em JS que a extensão do Chrome não conseguiu renderizar, mas o anexo `.xlsx` foi baixado via `curl` e extraído com um script Node ad-hoc, já que é só um zip com XML dentro). Confirmado: nomes de tag de `prest`/`toma`/`serv`/`valores`/`trib`; formato do `Id` de 45 caracteres; e que o grupo `IBSCBS` é **opcional e dispensável até 2027 para optantes do Simples Nacional** (o próprio anexo oficial afirma isso) — não é mais TODO esquecido, é omissão deliberada. Build e typecheck OK
- [x] 7. Kleber enviou a FIC (Ficha de Inscrição Cadastral) da Prefeitura — confirmou a Inscrição Municipal e deu o CNAE (`253900100 - SERVIÇOS DE USINAGEM, SOLDA E TORNEARIA`), usado para tentar deduzir o código de tributação nacional
- [x] 8. **Teste real ao vivo contra o servidor de homologação** (2026-09-08, com o certificado de verdade da Tornearia Castro, via PowerShell/Node — nada foi commitado em produção, é só o ambiente de teste do governo que não gera efeito fiscal). Isso substituiu toda suposição por confirmação de fato:
  - Corpo da requisição é **JSON** com campo `dpsXmlGZipB64` (não texto puro — corrigido, estava errado antes)
  - Declaração `<?xml version="1.0" encoding="UTF-8"?>` é **obrigatória** no XML (faltava)
  - Tag `<IM>` do prestador deve ser **omitida** — o sistema resolve sozinho a partir do CNPJ (estava sendo enviada, causava erro)
  - Grupo `<totTrib><indTotTrib>0</indTotTrib></totTrib>` é **obrigatório** dentro de `<trib>`, mesmo parecendo opcional pela ocorrência (faltava)
  - Assinatura XMLDSig da `SefinNacionalNfseService` **foi aceita pelo servidor real** — formato de assinatura confirmado correto
  - Formato do `Id` da DPS (45 caracteres) **confirmado correto** já na primeira tentativa certa
  - Único bloqueio real restante: os dois códigos de tributação nacional testados (`140101` e `140501`, ambos plausíveis pelo CNAE) foram **rejeitados pelo servidor** com "código não administrado pelo município" — não é bug, é classificação fiscal que só o contador ou a própria Prefeitura confirma. `NFSE_BH_CODIGO_TRIB_NACIONAL` deixado vazio de propósito
  - Certificado usado no teste foi importado temporariamente no cofre do Windows e **removido logo em seguida** (higiene de segurança)
- [x] 9. Código de tributação resolvido (140501, confirmado por Kleber) e serviço real conectado na Server Action — em produção desde 2026-09-09

**Notas:** Sem custo de provedor terceiro — o Emissor Nacional é gratuito. Instruções detalhadas em `docs/memoria/plano-tarefas.md`.

</details>

---

### 🟣 FASE 02.5: PORTAL DO ORÇAMENTO (compartilhamento e aprovação)
**Status:** `✅ Completa` — em produção (`main`), migration aplicada, testada e auditada
**Progresso:** 9/9 tarefas concluídas
**Objetivo:** Fechar o ciclo orçamento → cliente aprova → vira serviço, sem sair do CRM e sem retrabalho de digitação. Spec completa da Shiva em `docs/memoria/projeto.md` e `docs/memoria/moscow.md` (adendo).
**Por que agora, fora de ordem?** Fase 02 está travada esperando o código de tributação nacional (dado que só Kleber/contador resolvem, não é trabalho de código). Em vez de deixar o Atlas ocioso, esta fase entrou na frente — aprovada por Kleber em 2026-09-09.

#### Tarefas (plano técnico completo em `docs/memoria/plano-tarefas.md`):
- [ ] 1. Migration `0004_portal_orcamento.sql` — escrita, **não aplicada** (Supabase MCP não conectado nesta sessão; mesmo padrão das migrations 0001-0003, Kleber aplica via SQL Editor)
- [x] 2. `getOrdemServico(id)` em `src/lib/data/ordens-servico.ts`
- [x] 3. Página de detalhe `src/app/(app)/ordens-servico/[id]/page.tsx` (não existia — criada; link adicionado na lista)
- [x] 4. Server Action `compartilharOrcamento` (gera/renova link por 30 dias, exige administrador)
- [x] 5. Server Action `converterEmServico` (só se aprovado e ainda `orcado`, exige administrador)
- [x] 6. Rota pública `src/app/orcamento/[token]/page.tsx` — busca via `createAdminClient()` (service role), nunca via RLS/anon
- [x] 7. Server Actions públicas `aprovarOrcamento` / `recusarOrcamento` (sem sessão, idempotentes — checam token + validade + ainda não decidido)
- [x] 8. Liberado `/orcamento` no `src/proxy.ts`
- [x] 9. Botão de compartilhar via WhatsApp (`wa.me`, grátis, sem API paga) + copiar link

**Decisão de arquitetura (Hades), confirmada na execução:** primeira rota pública do sistema — não abre RLS para `anon`, usa o client de service role já existente (`src/lib/supabase/admin.ts`) e valida o token na aplicação. Nenhuma política de RLS nova foi criada. Nota de segurança registrada para o Kerberos revisar antes do deploy.

**Desvio encontrado durante a execução:** o plano da Hades previa "travar a edição de valores após aprovação" — mas o Atlas descobriu que **não existe edição de itens de mão de obra/materiais na UI hoje** (o dialog em `ordem-servico-form-dialog.tsx` só cria OS nova; os itens não têm tela de cadastro/edição própria ainda, é uma lacuna anterior a esta feature). Como não há o que travar, esse ponto do plano não se aplicou — nada foi construído além do escopo pedido. Registrado aqui para Hades decidir se isso vira uma tarefa própria depois.

**Testável:** Assim que Kleber aplicar a migration — compartilhar gera link → aba anônima mostra o orçamento → aprovar libera "Converter em Serviço" → status muda pra `em_execucao`. `npm run build` e `npx tsc --noEmit` já rodaram limpos com o código atual.
**Notas:** Sem custo novo — nem WhatsApp (link `wa.me` manual) nem infraestrutura nova. Adicionada env var `NEXT_PUBLIC_SITE_URL` em `.env.local` (não commitada) — falta replicar nas env vars do projeto Vercel (`telascastroclaudia@gmail.com`) antes do link público funcionar em produção. Regra de negócio: aprovar/recusar/converter é ação exclusiva de `administrador`, igual o resto do sistema.
**Último trabalho:** Commit `c445ce1` em `dev`, push feito. Migration aplicada e `NEXT_PUBLIC_SITE_URL` configurada por Kleber em 2026-09-09 — confirmado por Atlas via query real ao banco. Ravena testou a rota pública de ponta a ponta (aprovar, recusar, expiração, token inválido, mobile) e aprovou; não testou os botões "Compartilhar"/"Converter em Serviço" dentro do CRM por exigirem login (fora do que ela pode fazer). Kerberos auditou com ataque real usando a chave `anon` (RLS resistiu a leitura/escrita/exclusão indevida) e aprovou a feature — mas encontrou, fora do escopo desta fase, uma vulnerabilidade crítica não-relacionada no Next.js 16.3.2 (ver Patch de Segurança abaixo).

⚠️ **Bloqueio novo, fora do escopo desta fase, encontrado por Kerberos:** Next.js 16.3.2 tem RCE não-autenticada crítica (Image Optimization + AVIF), afeta qualquer hospedagem incluindo Vercel. Patch: `16.3.3`+. Decisão de Hades: sobe junto com a Fase 02.5 no mesmo ciclo `dev → hml`, em commit separado. Ver `docs/memoria/plano-tarefas.md`, seção "PATCH DE SEGURANÇA".

---

### 🟣 FASE 02.6: VALOR FECHADO NO ORÇAMENTO
**Status:** `✅ Completa — em produção` (deploy Vercel `success` em 2026-09-10, commit `265e48e`)
**Progresso:** 7/7 tarefas (100%) — dev/hml/main sincronizadas em `265e48e`

**Auditoria Kerberos (2026-09-10) — APROVADO 🛡️.** Pentest real com a chave pública contra a tabela nova `itens_servico`: leitura devolveu `[]` com linhas existindo, insert rejeitado (`42501`), update/delete afetaram zero linhas (RLS via USING). Ataque de vazamento na rota pública `/orcamento/[token]` sem login, com a palavra "MARGEM_SECRETA" e a taxa horária R$ 90 plantadas em mão de obra: **nenhum vaza** — nem no HTML nem no payload de hidratação; só a linha agregada legítima ("Execução do serviço") e o total aparecem. Confirmado que o valor unitário do bloco Serviço trafega (é o que o cliente compra), mas horas/valor-hora/materiais não. IDOR de token: 404 em token inválido/lixo. Rotas protegidas: 307 → /login sem sessão. CVE-2025-29927 (middleware bypass): imune (Next 16.3.4, header malicioso ainda redireciona pra login). Headers HTTP na rota pública: X-Frame-Options DENY, CSP com frame-ancestors none, nosniff, Referrer-Policy, Permissions-Policy — X-Powered-By não vaza. Server Actions públicas (aprovar/recusar) idempotentes, token UUID parametrizado, sem injeção. Diff cirúrgico — só toca os arquivos da fase. Dados de pentest removidos, banco restaurado.

**Achado não-bloqueante (fora do escopo da fase):** `npm audit` acusa 2 vulnerabilidades (js-yaml high, hono moderate), ambas **transitivas e de dependências de desenvolvimento** (eslint, shadcn) — não vão para o bundle de produção. Recomendação: `npm audit fix` quando conveniente, sem urgência. Não bloqueia o deploy desta fase.
**Objetivo:** Permitir lançar preço fechado (`Bucha de bronze · 5 · R$ 160,00`) sem abrir horas — hoje o sistema só sabe formar preço por mão de obra e materiais. E fechar a página pública: o cliente passa a ver o que compra, nunca como o preço foi formado.
**Por que agora?** Kleber tropeçou nisso usando o sistema de verdade — escreveu "Valor do serviço R$800,00" dentro do campo de descrição da OS-2026-0003 porque não havia onde lançar. O total ficou R$ 0,00. Lacuna de produto, não bug.

#### Tarefas (plano técnico completo em `docs/memoria/plano-tarefas.md`, seção FASE 02.6):
- [x] 1. Migration `0006_itens_servico.sql` — aplicada por Kleber em 2026-09-10, confirmada por consulta REST real (não por relato)
- [x] 2. `ItemServico`, `calcularValorServicos` e `calcularValorTotal` somando os três blocos (`src/lib/types/ordem-servico.ts`)
- [x] 3. `SELECT_ORDEM_SERVICO` + `toOrdemServico` trazendo os itens novos (`src/lib/data/ordens-servico.ts`)
- [x] 4. Server Actions: `adicionarServico`, `removerItem` aceitando `"servico"`, e `gerarContaAReceber` usando a fonte única
- [x] 5. Bloco "Serviço" na UI, acima de Mão de obra (`itens-lancamentos.tsx`) + texto explicando que os números cinzas são exemplos
- [x] 6. Página pública: para de buscar mão de obra e materiais do banco, mostra as linhas de Serviço, total calculado no servidor
- [x] 7. Manual atualizado e versionado no git — **ressalva:** o `.pdf` continua na versão anterior (sem ferramenta de geração no projeto)

**Resolução do risco principal:** a fórmula duplicada foi unificada em `calcularTotalOrdemServico()` (`src/lib/data/ordens-servico.ts`), usada tanto pela conta a receber quanto pela página pública. Restaram duas implementações por decisão consciente: essa (busca por id, para quem só tem o id) e o helper `calcularValorTotal()` (puro, para quem já tem o objeto carregado). Ambas somam os três blocos.

**Verificação em execução real (2026-09-10, servidor local + banco de produção):** lançamento `Bucha de bronze · 5 · R$ 160,00` e `Recorte de chapa · 3 · R$ 150,50` (vírgula aceita) somados a materiais e mão de obra deram **R$ 1.471,50** iguais na tela da OS, na listagem e — o teste que importava — **na conta a receber gerada ao faturar**. Página pública mostrou a linha de Serviço e o total, sem nenhuma ocorrência de mão de obra ou materiais no HTML servido nem no payload de hidratação. RLS testado com a chave `anon`: leitura devolveu `[]` com 2 linhas existindo, escrita rejeitada (`42501`). Trava pós-aprovação some com os três formulários. Dados de teste removidos; banco restaurado ao estado original.

**Sessão de teste autenticada sem senha:** token administrativo emitido via Admin API do Supabase (mesmo mecanismo do "esqueci minha senha"). Nenhuma senha digitada, vista ou armazenada.

**Risco principal identificado pelo Hades:** o valor total é recalculado em **três lugares** com cópias independentes da fórmula — `src/lib/types/ordem-servico.ts:51-61` (helper), `src/app/orcamento/[token]/page.tsx:69-74` (página pública) e `src/app/(app)/ordens-servico/actions.ts:313-317` (conta a receber). Se o bloco novo entrar em dois dos três, o sistema mostra um valor na tela e cobra outro — e, pior, `gerarContaAReceber` desiste em silêncio quando o valor é zero, faturando a OS sem gerar cobrança nem nota. O plano manda unificar a fórmula numa função só.

**Correção factual à spec da Shiva, verificada em código:** o Dashboard **não** é impactado (usa `listOrdensServico()` só para distribuição de status; os valores vêm de `transacoes_financeiras`). A NFS-e também não muda diretamente — herda o valor da transação criada em `gerarContaAReceber`.

**Testável:** ✅ testado e aprovado no ambiente local contra o banco real (ver acima).
**Notas:** Custo zero — sem dependência nova, sem serviço novo, sem credencial nova.
**QA da Ravena (2026-09-10) — APROVADO COM RESSALVA, ressalva já corrigida.** Ela aprovou o lançamento, a soma dos três blocos, a vírgula, o compartilhamento e — com a palavra "SEGREDO DA CASA" plantada nos itens internos — confirmou zero vazamento no que sai do servidor. Encontrou um defeito de produto que o plano do Hades não previu: no uso **misto**, o cliente via uma linha de R$ 800,00 e um total de R$ 1.020,00, com R$ 220,00 sem explicação. Não lia como discrição, lia como erro de conta. **Decisão do Hades:** linha agregada fechando a diferença, com rótulo fiel ao que foi lançado (`Materiais e execução` / `Materiais` / `Execução do serviço`). Corrigido e verificado nos 5 casos possíveis — o total sempre bate com a soma das linhas visíveis. A conta a receber foi refeita de ponta a ponta após a refatoração (R$ 1.020,00, correto). **Não testado:** responsividade — o Chrome ignorou dois pedidos de redimensionamento; Kleber vai conferir no próprio celular.

**Pendente antes de produção:** re-teste da Ravena e auditoria do Kerberos (mudança de exposição de dados numa rota pública). Depois, ciclo `dev → hml → main` com backup por tag e aprovação explícita de Kleber.
**Último trabalho:** Commits `a41437c` (feature) e `4f26c3a` (docs/manual) em `dev`, push feito, working tree limpo.

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
- [x] Headers de segurança configurados em `next.config.ts` (2026-09-09): `X-Frame-Options: DENY` + `frame-ancestors none`, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, e `poweredByHeader: false` (o site anunciava "X-Powered-By: Next.js"). HSTS já vinha da Vercel. Limitação registrada: `script-src` precisa de `unsafe-inline`/`unsafe-eval` por causa dos scripts inline do próprio Next.js — fechar isso exigiria nonce via proxy, com risco desproporcional dado que a aplicação não renderiza HTML de terceiros. Verificado em produção com browser real: zero violações de CSP, login e página pública de orçamento renderizando normalmente.
- [ ] Merge `dev → hml` → aprovação de Kleber → merge `hml → main`
- [ ] Confirmar deploy final em produção na Vercel (conta telascastroclaudia@gmail.com)

**Testável:** Sistema em produção, aprovado por Ravena e Kerberos, uso real liberado.

---

## Backups e Segurança
| Data | Tag | Tipo | Status |
|------|-----|------|--------|
| 2026-09-09 | `backup-pre-hml-20260909-143322` | Pré-HML | ✅ |
| 2026-09-09 | `backup-pre-prod-20260909-161424` | 🔴 Pré-Produção | ✅ |
| 2026-09-09 | `backup-pre-hml-20260909-165102` | Pré-HML | ✅ |
| 2026-09-09 | `backup-pre-prod-20260909-165238` | 🔴 Pré-Produção | ✅ |
| 2026-09-10 | `backup-pre-hml-20260910-183453` | Pré-HML (Fase 02.7) | ✅ |
| 2026-09-10 | `backup-pre-prod-20260910-183718` | 🔴 Pré-Produção (Fase 02.7) | ✅ |

## Histórico de Sessões
| Data | O que foi feito |
|------|----------------|
| 2026-08-26 | Shiva conduziu descoberta + MoSCoW (tudo Must Have, sem faseamento de escopo). Hades recebeu a spec, mapeou bloqueios reais do ambiente (sem git, sem GitHub/Supabase MCP, conta Vercel/Supabase da sessão é a pessoal do Kleber, não a de deploy) e criou o roadmap em 4 fases. |
| 2026-08-26 | Atlas inicializou o git local, renomeou branch padrão para `main`, criou `dev`/`hml`, e publicou o repositório em github.com/TorneariaCastro/tornearia-castro — a conta `gh` já autenticada era a certa, sem precisar pedir nada a Kleber. Fase 01 aguardando credenciais Vercel/Supabase da conta separada. |
| 2026-08-26 | Atlas implementou schema+RLS (SQL pronto, não aplicado), Supabase Auth, proxy de rota, e substituiu todos os mocks por dados reais (commits `0f16a06`, `c728d0c` em `dev`). Build/lint/typecheck OK. Dois bloqueios ficaram para Kleber resolver: aplicar a migration (sem Management API token) e autorizar `vercel link` (negado pelo classificador de permissão). |
| 2026-09-07 | Kleber pediu a ativação da NFS-e real de BH. Shiva conduziu discovery focada (caminho direto vs provedor, certificado, cadastro municipal, homologação) e documentou a decisão em `docs/memoria/integracao-nfse-bh.md`. Hades recebeu a spec, confirmou via pesquisa web os endpoints do webservice BHISS Digital (homologação e produção) e criou o plano técnico de 8 passos em `plano-tarefas.md` para o Atlas. |
| 2026-09-09 | Kleber pediu compartilhamento de orçamento com clientes (link + WhatsApp + aprovação + conversão em serviço). Shiva conduziu discovery, fez MoSCoW da feature e documentou em `projeto.md`/`moscow.md`. Hades recebeu a spec, decidiu encaixar como Fase 02.5 (aproveitando a Fase 02 travada), definiu a arquitetura de segurança da rota pública (service role + validação por token, sem abrir RLS) e escreveu o plano técnico de 9 passos em `plano-tarefas.md` para o Atlas. |
| 2026-09-09 | Atlas implementou a Fase 02.5 completa (commit `c445ce1`). Ravena testou a rota pública de ponta a ponta com browser real (aprovar, recusar, expiração, token inválido, mobile) — aprovou; não testou os botões internos "Compartilhar"/"Converter" por exigirem login (fora do que ela executa). Kerberos auditou com ataque real via chave `anon` contra o banco (leitura/escrita/exclusão bloqueadas pelo RLS) e aprovou a feature — mas encontrou, fora do escopo, RCE crítica não-autenticada no Next.js 16.3.2 (Image Optimization). Hades decidiu subir os dois juntos no mesmo ciclo `dev → hml`, em commits separados. Atlas aplicou o patch (`9dd64b5`), criou backup `backup-pre-hml-20260909-143322`, e — com confirmação explícita de Kleber — fez o merge `dev → hml` (fast-forward, `4261e4d..9dd64b5`), primeiro merge para `hml` desde o início do projeto. Build e typecheck limpos em `hml`. |
| 2026-09-09 | Kleber tentou testar os botões manualmente e travou em dois problemas: (1) o botão "Criar Orçamento" do Dashboard fica desabilitado porque a seleção de cliente no `<Select>` não "gruda" no estado — confirmado via inspeção real do DOM (atributo `disabled` presente, campo oculto `clienteId` vazio, item da lista com `aria-selected="false"`); bug pré-existente da Fase 01, não desta fase, registrado para Hades investigar a causa raiz depois. Atlas contornou criando a OS-2026-0001 direto no banco (cliente real "Kleber Pereira") pra destravar o teste. (2) Kleber não encontrava a seção "Compartilhamento e aprovação" — causa raiz real: a Fase 02.5 nunca tinha sido promovida pra `main`/produção, só existia em `hml`. Confirmado via `git log origin/main..origin/hml` (14 commits pendentes). Com aprovação explícita de Kleber e backup crítico (`backup-pre-prod-20260909-161424`), Atlas fez o merge `hml → main` (fast-forward `f024264..9dd64b5`), build/typecheck limpos, push feito — Fase 02.5 e o patch do Next.js agora em produção de verdade. |
| 2026-09-09 | Atlas achou a causa raiz do bug do "Criar Orçamento" (item pendente da entrada anterior): o campo de cliente usava `""` como valor de "nada selecionado", mas o Base UI Select (biblioteca de componentes do projeto) espera `null` para esse caso — confirmado comparando com os outros usos de `<Select>` no projeto (todos partem de um valor real, nunca vazio) e com a documentação oficial do Base UI. Corrigido em `ordem-servico-form-dialog.tsx`, verificado com um teste isolado real via Playwright (não só leitura de código) antes do commit. Com aprovação de Kleber, promovido no mesmo ciclo rápido `dev → hml → main` (tags `backup-pre-hml-20260909-165102` e `backup-pre-prod-20260909-165238`), build/typecheck limpos em cada branch. |
| 2026-09-09 | **Bloqueio crítico encontrado e resolvido:** não existia nenhuma forma de lançar receita ou despesa — a tela Financeiro só listava, nada no código gravava na tabela e o banco tinha zero transações. Como o botão "Emitir NFSe" fica numa transação **paga** do Financeiro, era impossível emitir nota fiscal pelo sistema, mesmo com toda a integração pronta. Também faltava o elo: faturar uma OS não gerava conta a receber. Implementado: dialog de nova movimentação (entrada/saída, categoria para despesa, cliente para receita), dar baixa informando forma de pagamento, cancelar movimentação, e geração automática da conta a receber ao marcar a OS como Faturado (idempotente). Testado em produção de ponta a ponta: despesa lançada → baixa via PIX → status Pago; OS de R$ 300 levada de Orçado até Faturado → conta a receber criada sozinha com vencimento em 30 dias e vínculo ao cliente. Dados de teste removidos, OS restaurada. |
| 2026-09-09 | **NFS-e real ligada em produção.** Sete defeitos reais corrigidos na integração, todos validados contra a especificação oficial "API NFS-e - Sefin Nacional v1" e o anexo técnico do gov.br/nfse: (1) o certificado nunca era enviado — `fetch` do Node ignora a opção `agent`, trocado por `node:https`; (2) data/hora fora do padrão TSDateTimeUTC; (3) resposta de emissão lida como XML comprimido quando é JSON, descartando a chave de acesso; (4) consulta e cancelamento em host/rotas errados; (5) cancelamento com XML improvisado; (6) `pAliq` enviado como fração onde o layout espera percentual — e removido de vez, já que BH pertence ao Sistema Nacional e a Receita aplica a alíquota parametrizada; (7) **regra E0712**: para optante ME/EPP o campo `indTotTrib` nunca pode ser enviado, e era exatamente o que o código mandava — toda nota seria rejeitada; trocado por `pTotTribSN`. Também: documento do tomador ia vazio (agora buscado no cadastro, no servidor) e migration 0005 guarda a chave de acesso. Varredura dos 335 códigos da lista nacional contra homologação mostrou que o ambiente de teste não tem os dados de BH carregados (`ParametrosMunicipais` responde 501 em teste e em produção), então a validação final só é possível em produção. Configuração gravada nas env vars da Vercel (certificado e senha como `sensitive`), ambiente = produção, cTribNac 140501 (**confirmado por Kleber em 2026-09-09**, não é dedução: "Restauração, recondicionamento, corte, recorte, acabamento, polimento e congêneres de objetos quaisquer"), opSimpNac 3, pTotTribSN 6%. Deploy verificado: telas de Notas Fiscais, Financeiro, OS e Dashboard respondem 200 sem erro. **Nenhuma nota emitida** — a primeira emissão real depende de decisão de Kleber com um serviço de verdade. |
| 2026-09-09 | **Duas lacunas de produto fechadas** (Kleber percebeu ao usar de verdade): (1) **Lançamento de valores** — as tabelas `itens_mao_de_obra`/`itens_materiais` existiam no banco e as telas já sabiam exibi-las, mas nunca houve interface para cadastrá-las: toda OS e todo orçamento enviado ao cliente saía R$ 0,00. Criada a seção "Valores do serviço" na tela da OS (lançar/remover mão de obra e materiais), com a trava prevista na spec: aprovado pelo cliente → valores bloqueados. (2) **Ciclo de status incompleto** — a OS só chegava até "Em Execução"; não havia como marcar "Pronto" ou "Faturado", nem caminho para o cliente que aprova por telefone (sem o link). Criada a seção "Andamento do serviço" com as transições validadas no servidor (`avancarStatus`), incluindo "Iniciar serviço" para aprovação fora do sistema e cancelamento com confirmação em dois passos. Ambos testados em produção com sessão real: valores R$ 0,00 → R$ 651,00 refletindo na listagem e na página do cliente; ciclo Orçado → Em Execução → Pronto → Faturado completo. Dados de teste do Atlas removidos e OS-2026-0003 restaurada ao status original. |
| 2026-09-09 | **Causa raiz final do "clico e não acontece nada":** os formulários dentro de dialog dependiam da validação nativa do HTML (`required`). Dentro do dialog do Base UI, o navegador **bloqueia o envio mas não consegue exibir o balão de validação** — o clique era engolido em silêncio, sem erro, sem toast, sem nada na tela. Provado em produção com sessão autenticada real: com cliente selecionado e descrição vazia, `form.checkValidity()` era `false`, o botão continuava habilitado, e o clique não gerava nem log de console. Explica também por que o banco não tinha nenhum registro das tentativas de Kleber. Correção: `noValidate` + validação explícita no `handleSubmit` com mensagem visível, aplicada nos três formulários com o mesmo padrão (OS/orçamento, cliente, usuário). Verificado em produção após deploy: sem descrição → mensagem "Descreva o serviço para continuar." aparece na tela e em toast; com descrição → OS criada e dialog fecha. OS de teste do Atlas removidas do banco ao final; sessão de teste encerrada com `signOut()`. |
| 2026-09-10 | **Fase 02.6 (Valor Fechado no Orçamento) subiu para produção.** Ciclo completo do S.H.A.R.K. numa sessão: Shiva especificou (bloco Serviço somando com os outros; cliente vê o que compra, não como o preço é formado), Hades planejou em 7 passos e mapeou o risco da fórmula triplicada, Atlas implementou. Ravena testou com browser real e achou o defeito que o plano não previu — no uso misto o total não fechava com as linhas visíveis (R$ 800 na linha, R$ 1.020 no total). Hades decidiu a linha agregada com rótulo dinâmico; Atlas corrigiu e Ravena re-aprovou (responsividade ficou não testada — rede de hóspedes bloqueou o celular). Kerberos fez pentest real com a chave pública: RLS resiste, margem não vaza na rota pública, IDOR/CVE/headers OK; achado não-bloqueante de 2 vulns em deps de dev. Promovido dev→hml→main com backups `backup-pre-hml-20260910-134439` e `backup-pre-prod-20260910-134556`, confirmação explícita de Kleber em cada merge. Deploy Vercel `success`, migration 0006 confirmada no banco, headers verificados em produção. |
| 2026-09-10 | Kleber perguntou como preencher o valor total do orçamento. Shiva investigou o código e achou a lacuna real: não existe onde lançar preço fechado — só mão de obra e materiais — e por isso ele tinha escrito "R$800,00" dentro do campo de descrição. Discovery confirmou que a Tornearia usa os dois modos conforme o serviço, e que a página pública hoje entrega a formação de preço (mostra `4 h · R$ 480,00`, de onde se deduz a hora). Spec escrita em `projeto.md`/`moscow.md` com duas decisões de Kleber: bloco "Serviço" somando junto com os outros (sem seletor de modo) e cliente vendo as linhas de Serviço mas nunca mão de obra/materiais. Hades recebeu, verificou o código e encontrou o risco central — a fórmula do valor total existe em três cópias independentes, e a de `gerarContaAReceber` falha em silêncio quando dá zero. Plano de 7 passos escrito em `plano-tarefas.md` (Fase 02.6), corrigindo de passagem dois pontos da spec que não batiam com o código (Dashboard e NFS-e não são impactados diretamente). |
| 2026-09-10 | Atlas executou a Fase 02.6 completa (commits `a41437c` e `4f26c3a` em `dev`). Kleber aplicou a migration `0006` e Atlas confirmou por consulta REST real, não por relato. Testes em execução real com sessão administrativa emitida pela Admin API (sem senha): total de R$ 1.471,50 idêntico na tela da OS, na listagem e na conta a receber gerada ao faturar — o teste que provava o risco central do plano. Página pública verificada linha a linha no HTML servido: nenhuma ocorrência de mão de obra ou materiais. RLS da tabela nova testado com a chave `anon` (leitura `[]`, escrita `42501`). Trava pós-aprovação confirmada nos três blocos. Dados de teste removidos e banco restaurado. Duas ressalvas registradas: nada foi para produção (está só em `dev`) e o `.pdf` do manual continua desatualizado. |
| 2026-09-09 | Kleber reportou que ainda não funcionava mesmo após o deploy. Atlas confirmou via `gh api` que o deploy tinha terminado com sucesso na Vercel, e — pela primeira vez nesta sessão — testou o clique de verdade em produção, autenticado como Kleber, sem nunca lidar com senha: gerou um magic link administrativo via Supabase Admin API (`/auth/v1/admin/generate_link`) e usou `client.auth.setSession()` dentro do próprio navegador de teste pra virar uma sessão real (cookie `sb-...-auth-token`), a mesma forma como o "esqueci minha senha" funciona. Achou um SEGUNDO bug real, diferente do primeiro: o campo Cliente mostrava o UUID bruto em vez do nome ("459128f3-..." em vez de "Kleber Pereira") — comportamento padrão documentado do Base UI Select.Value (mostra o valor bruto a menos que se passe o prop `items` com `{value, label}`). Corrigido, verificado com o clique real na mesma sessão autenticada (nome aparece certo, botão habilita, OS é criada de verdade — contagem foi de 1 para 2), promovido no mesmo ciclo `dev → hml → main` (tags `backup-pre-hml-20260909-171722` e `backup-pre-prod-20260909-171814`). Sessão de teste encerrada com `signOut()` ao final. |
| 2026-09-10 | **Limpeza das OS de teste no banco de produção.** Kleber pediu a remoção das 4 ordens de serviço de teste (`OS-2026-0001` a `0004`) e relatou não encontrar botão de excluir. Shiva investigou o código e confirmou que ele estava certo: **não existe** função de exclusão de OS no sistema — só "Cancelar OS", que mantém a OS na lista. Encontrou também o risco central da tarefa: `proximoNumero()` gera o número contando linhas do ano, então apagar um *subconjunto* de OS faria o contador colidir com a constraint `unique` e quebrar a criação da próxima OS. Apagar as 4 era o caso seguro. Atlas executou sem depender de Kleber colar SQL: sem Supabase MCP, usou a REST API com a `service_role key` do `.env.local`. Antes de apagar, verificou as 5 tabelas dependentes (`itens_servico`, `itens_mao_de_obra`, `itens_materiais`, `transacoes_financeiras`, `notas_fiscais`) — todas zeradas, confirmando que nenhum histórico financeiro ou fiscal seria destruído. 4 linhas apagadas, `count` do banco confirmado em 0, e a numeração medida via `Content-Range: */0` (próxima OS nascerá `OS-2026-0001`). Um erro no caminho: a primeira medição da numeração usou o cabeçalho `Range`, bloqueado pelo PowerShell 5.1, e o número exibido veio de variável nula — o Atlas **não** aceitou como prova e refez com `Prefer: count=exact`. Hades validou por consulta independente (banco zerado, cliente real preservado) e revisou a seção "Bloqueios Conhecidos" deste arquivo, que estava obsoleta desde o primeiro dia do projeto. Commits `4da1646` (documentação do procedimento) e a revisão do asbuilt em `dev`. Nada promovido para `hml`/`main` — não houve mudança de código. |
| 2026-09-10 | **Fase 02.7 — numeração de OS à prova de colisão (implementada em `dev`).** Kleber perguntou o que envolveria corrigir a numeração e aprovou. Hades registrou a decisão em `docs/decisions/ADR-001` (primeiro ADR do projeto), descartando explicitamente sequence pura (não reinicia por ano), proibir exclusão de OS (não resolve concorrência) e UUID na tela (não se dita ao telefone). Atlas implementou a migration `0007_numeracao_os.sql` — tabela `os_contador`, função `public.proximo_numero_os()` com `security definer` + `search_path` fixo + trava de administrador — e trocou `proximoNumero()` para `.rpc()`, espelhando o padrão já usado em `0003_nfse_rps_sequencial`. Kleber aplicou a migration no SQL Editor; Atlas confirmou por consulta real (baseline HTTP 404 antes, tabela existente e função respondendo depois). Testes com sessão de administrador obtida via Admin API (`generate_link` + `verify` com `token_hash`, sem senha): chamadas consecutivas retornaram `OS-2026-0001`, `0002`, `0003` — sem repetição, que é exatamente o cenário que quebrava antes. RLS verificado: `os_contador` invisível para usuário autenticado (0 linhas). Trava de papel confirmada: chamada com `service_role` (que não carrega papel `administrador`) recusada com HTTP 403. Corrigido de passagem um bug de fuso que ninguém tinha notado — o ano vinha de `new Date().getFullYear()`, que roda em UTC na Vercel e viraria o ano às 21h de 31/dezembro, horário de Brasília. Commits `450c69a` (plano + ADR) e `2b9615e` (migration + código) em `dev`. **Não promovido para `hml`/`main`.** Pendência para decisão de Kleber: os três testes consumiram números, então `os_contador` está em 3 e a primeira OS real nasceria `OS-2026-0004`. |
| 2026-09-10 | **Fase 02.7 promovida até produção — ciclo completo do S.H.A.R.K. numa sessão.** Kleber aprovou zerar o contador (Hades emendou o ADR-001 distinguindo "buraco" — número que identificou um documento, nunca reciclar — de "resíduo de teste" — número que nunca identificou nada, descartável enquanto a tabela estiver vazia). **Ravena** testou no navegador real contra servidor local rodando o código novo, com sessão de administrador obtida por link de uso único: criou a OS pela tela (`OS-2026-0001`), apagou, criou outra (`OS-2026-0002`) — o número não voltou, que era exatamente o cenário quebrado. Zero erros de console. Registrou que `localhost:3000` não está na lista de redirecionamentos autorizados do Supabase, o que dificulta QA local. **Kerberos** fez pentest real: plantou isca no banco antes de atacar (sem isca, "0 linhas" não distingue RLS funcionando de tabela vazia), atacou com chave `anon` (401 na RPC, 0 linhas em leitura, zero linhas afetadas em escrita) e **criou um consultor de verdade** para atacar com ele (403 na RPC). O teste decisivo: o consultor conseguiu gravar `user_metadata.role = administrador` no próprio cadastro — e continuou bloqueado, porque `is_administrador()` lê `app_metadata` (403 ao tentar alterar), não `user_metadata`. Escalação de privilégio via manipulação de metadata: impossível. Promovido `dev → hml → main` com tags `backup-pre-hml-20260910-183453` e `backup-pre-prod-20260910-183718`, confirmação explícita de Kleber, build e typecheck limpos em cada branch. Deploy Vercel `success` no sha `6450390`. Hades identificou e comunicou o risco da janela entre migration aplicada e código publicado (criar OS nesse intervalo geraria colisão pós-deploy) — verificado antes e depois: nenhuma OS criada. Estado final: `ordens_servico` 0, `os_contador` 0 — a primeira OS real de Kleber será `OS-2026-0001`. |
