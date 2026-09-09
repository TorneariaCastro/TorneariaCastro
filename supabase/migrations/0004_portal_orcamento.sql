alter table ordens_servico
  add column token_compartilhamento uuid not null default gen_random_uuid() unique,
  add column aprovado_em timestamptz,
  add column recusado_em timestamptz,
  add column link_expira_em timestamptz;
