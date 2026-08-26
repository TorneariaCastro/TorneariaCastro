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

## Próximas tarefas desta fase (após git + credenciais resolvidos)
Ver `docs/asbuilt.md` → FASE 01 para a lista completa (schema Supabase, RLS, Auth, substituição dos mocks, criação do projeto Vercel).
