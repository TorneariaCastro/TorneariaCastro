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
