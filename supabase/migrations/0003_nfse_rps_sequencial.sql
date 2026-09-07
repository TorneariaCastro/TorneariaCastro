-- Numeracao sequencial de RPS exigida pelo layout ABRASF (BHISS Digital).
-- Gerada no banco (nao em memoria no Node) para nao colidir em emissoes concorrentes.
create sequence if not exists nfse_rps_sequencial start 1 increment 1;

-- Guarda o numero de RPS usado em cada nota, para nunca reemitir um numero
-- ja consumido mesmo se a chamada ao webservice falhar depois do envio.
alter table notas_fiscais add column if not exists rps_numero bigint;
alter table notas_fiscais add column if not exists rps_serie text not null default '1';

create unique index if not exists notas_fiscais_rps_numero_serie_key
  on notas_fiscais (rps_numero, rps_serie)
  where rps_numero is not null;

-- Expoe o proximo numero de RPS via RPC (sequences nao sao acessiveis
-- diretamente pelo cliente supabase-js).
create or replace function public.nextval_nfse_rps_sequencial()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('nfse_rps_sequencial');
$$;

grant execute on function public.nextval_nfse_rps_sequencial() to authenticated;
