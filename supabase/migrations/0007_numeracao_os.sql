-- Numeracao de OS a prova de colisao.
-- Antes: proximoNumero() contava linhas do ano no Node. Contagem anda para tras,
-- entao apagar uma OS (ou criar duas ao mesmo tempo) gerava um numero ja existente
-- e a constraint unique de ordens_servico.numero derrubava a criacao.
-- Ver docs/decisions/ADR-001-numeracao-de-ordens-de-servico.md

create table if not exists os_contador (
  ano int primary key,
  ultimo_numero int not null default 0
);

alter table os_contador enable row level security;

-- Nenhuma policy, de proposito: o acesso e exclusivamente pela funcao
-- security definer abaixo, que roda como dona da tabela e nao passa por RLS.
-- Cliente autenticado nao le nem escreve nesta tabela diretamente.

-- Semeadura a partir do que ja existe, por ano. Hoje ordens_servico esta vazia,
-- mas isso mantem a migration correta caso alguma OS seja criada antes de aplicar.
insert into os_contador (ano, ultimo_numero)
select
  (regexp_replace(numero, '^OS-([0-9]{4})-[0-9]+$', '\1'))::int as ano,
  max((regexp_replace(numero, '^OS-[0-9]{4}-([0-9]+)$', '\1'))::int) as ultimo_numero
from ordens_servico
where numero ~ '^OS-[0-9]{4}-[0-9]+$'
group by 1
on conflict (ano) do update
  set ultimo_numero = greatest(os_contador.ultimo_numero, excluded.ultimo_numero);

-- Incrementa e devolve o proximo numero numa unica instrucao atomica.
-- Fuso de Sao Paulo de proposito: now() no Postgres e UTC, entao entre 21h e 24h
-- de 31/dezembro (horario de Brasilia) o ano viraria antes da hora.
create or replace function public.proximo_numero_os()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ano int := extract(year from timezone('America/Sao_Paulo', now()))::int;
  v_num int;
begin
  if not public.is_administrador() then
    raise exception 'Apenas administradores podem gerar numero de ordem de servico.'
      using errcode = '42501';
  end if;

  insert into os_contador (ano, ultimo_numero)
  values (v_ano, 1)
  on conflict (ano) do update
    set ultimo_numero = os_contador.ultimo_numero + 1
  returning ultimo_numero into v_num;

  return 'OS-' || v_ano::text || '-' || lpad(v_num::text, 4, '0');
end;
$$;

grant execute on function public.proximo_numero_os() to authenticated;
