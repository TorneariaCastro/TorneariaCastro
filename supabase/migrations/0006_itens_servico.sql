-- Preco fechado: o que o cliente compra, sem abrir a formacao de preco.
-- Mesmo padrao de itens_materiais (quantidade x valor unitario), sem "unidade":
-- material se mede (kg, m), servico fechado se conta em pecas.

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
