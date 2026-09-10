# ADR-001 — Numeração de ordens de serviço

**Status:** Aceita
**Data:** 2026-09-10
**Decidido por:** Hades, aprovado por Kleber

---

## Contexto

O número da OS (`OS-2026-0004`) é gerado em `proximoNumero()` (`src/app/(app)/ordens-servico/actions.ts:13-21`) **contando as linhas do ano e somando 1**:

```ts
const { count } = await supabase
  .from("ordens_servico")
  .select("id", { count: "exact", head: true })
  .gte("data_abertura", `${ano}-01-01`);
const sequencial = String((count ?? 0) + 1).padStart(4, "0");
```

`ordens_servico.numero` tem constraint `unique` (`0001_init.sql`). Contagem é um valor que **anda para trás**, e isso quebra a unicidade de duas formas:

1. **Exclusão de um subconjunto de OS.** Com `0001` e `0004` no banco (`0002`/`0003` apagadas), `count = 2` → gera `OS-2026-0003` (livre, ok) → na próxima, `count = 3` → gera `OS-2026-0004`, que **já existe**. A criação falha com a mensagem genérica `"Não foi possível criar a ordem de serviço."`, sem pista da causa real.
2. **Concorrência.** Duas OS criadas no mesmo instante leem o mesmo `count` e geram o mesmo número. Probabilidade baixa com 2 usuários, mas não é zero — e o modo de falha é idêntico e igualmente ilegível.

O problema deixou de ser teórico em 2026-09-10, quando Kleber pediu a remoção de 4 OS de teste. Apagar as 4 era seguro (contador volta a zero); apagar 3 teria armado a colisão para a próxima OS real.

## Decisão

Substituir a contagem por um **contador persistido no banco, incrementado atomicamente**, exposto via função `security definer` e consumido por `.rpc()`.

- Tabela `os_contador (ano int primary key, ultimo_numero int)`.
- Função `public.proximo_numero_os()` que faz `insert ... on conflict (ano) do update ... returning` — uma única instrução, atômica sob concorrência.
- `proximoNumero()` no TypeScript passa a chamar a função em vez de contar.

## Alternativas descartadas

**A) Sequence pura do Postgres (`create sequence`), como `nfse_rps_sequencial`.**
Descartada porque uma sequence não reinicia por ano. Em 2027 a numeração continuaria de onde parou (`OS-2027-0248`), quebrando a leitura natural do número. Reiniciar exigiria um job anual de `alter sequence restart` — uma peça móvel a mais para manter, e um jeito novo de errar em silêncio.

**B) Continuar contando, mas proibir exclusão de OS.**
Descartada porque não resolve a colisão por concorrência e transforma uma limitação técnica em regra de negócio artificial.

**C) Não usar número sequencial (usar o `id` UUID na tela).**
Descartada por usabilidade: `OS-2026-0001` é o que Kleber e o cliente falam ao telefone. UUID não se dita.

## Consequências

**Positivas**
- Colisão de numeração deixa de ser possível, por exclusão ou por concorrência.
- Alinha a numeração de OS ao padrão que o projeto **já usa corretamente** para o RPS da NFS-e (`0003_nfse_rps_sequencial.sql`) — um padrão a menos para manter na cabeça.
- Corrige de passagem o fuso: hoje o ano vem de `new Date().getFullYear()`, que na Vercel roda em UTC — entre 21h e 24h de 31/dezembro (horário de Brasília) o sistema já viraria o ano. A função usa `America/Sao_Paulo`.

**Negativas (aceitas)**
- **A numeração passa a ter buracos.** Apagar a `OS-2026-0007` deixa a sequência `0006, 0008`; o número 7 não volta. É o comportamento correto para número de documento (nota fiscal, boleto e cheque funcionam assim) — reciclar número faria duas coisas distintas compartilharem identidade no histórico.
- **O contador incrementa antes do insert.** Se a criação da OS falhar depois de obter o número, aquele número é consumido e vira um buraco. Mesmo comportamento (deliberado) de `nextval_nfse_rps_sequencial`.
- **Descasamento teórico de 3 horas na virada do ano** entre o ano do número (São Paulo) e `data_abertura` (gravado em UTC por `default now()`). Uma OS aberta em 31/12 às 22h receberia número `OS-2026-XXXX` com `data_abertura` em 2027. Aceito: a oficina não opera nessa faixa, e corrigir exigiria mexer no default de uma coluna já em produção — custo desproporcional ao risco.

## Emenda de 2026-09-10 — o que "não restaurar o contador" quer dizer

Logo após a aplicação, os testes de aceitação consumiram os números 0001, 0002 e 0003 chamando a função diretamente. O contador ficou em 3, e a primeira OS real nasceria `OS-2026-0004`. O contador foi **zerado** antes do uso real, com `ordens_servico` vazia.

Isso não contradiz a regra dos buracos. A distinção:

- **Número que identificou um documento** — a OS existiu, foi falada ao telefone, virou orçamento enviado ao cliente ou nota fiscal. Esse número está queimado para sempre. Reciclar faria duas coisas distintas compartilharem identidade no histórico. **Nunca restaurar.**
- **Número que nunca identificou nada** — consumido por teste, sem OS criada, sem papel, sem cliente. É resíduo, não histórico. **Pode ser descartado enquanto `ordens_servico` estiver vazia**, porque não existe documento com que colidir.

Critério prático para o futuro: só é seguro zerar o contador se **nenhuma** OS existir no banco para aquele ano. Havendo qualquer OS, o contador tem de permanecer acima do maior número já usado — e a semeadura da migration `0007` faz exatamente isso.

## Momento da aplicação

Executada com `ordens_servico` **vazia** (0 linhas, após a limpeza das OS de teste em 2026-09-10). É o momento mais barato possível: o contador nasce zerado e não precisa ser calibrado a partir de dados existentes. Ainda assim, a migration faz a semeadura a partir do maior número já existente por ano — para permanecer correta caso alguma OS seja criada entre a escrita e a aplicação.
