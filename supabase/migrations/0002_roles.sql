-- Papeis: administrador (leitura+escrita) e consultor (somente leitura).
-- O papel fica em auth.users.app_metadata.role, alteravel apenas via Admin API
-- (service_role key) -- nunca pelo proprio usuario autenticado.

drop policy if exists "authenticated_full_access" on clientes;
drop policy if exists "authenticated_full_access" on ordens_servico;
drop policy if exists "authenticated_full_access" on itens_mao_de_obra;
drop policy if exists "authenticated_full_access" on itens_materiais;
drop policy if exists "authenticated_full_access" on transacoes_financeiras;
drop policy if exists "authenticated_full_access" on notas_fiscais;

create or replace function public.is_administrador()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'administrador', false);
$$;

create policy "leitura_autenticados" on clientes for select to authenticated using (true);
create policy "escrita_administrador" on clientes for insert to authenticated with check (public.is_administrador());
create policy "atualizacao_administrador" on clientes for update to authenticated using (public.is_administrador()) with check (public.is_administrador());
create policy "exclusao_administrador" on clientes for delete to authenticated using (public.is_administrador());

create policy "leitura_autenticados" on ordens_servico for select to authenticated using (true);
create policy "escrita_administrador" on ordens_servico for insert to authenticated with check (public.is_administrador());
create policy "atualizacao_administrador" on ordens_servico for update to authenticated using (public.is_administrador()) with check (public.is_administrador());
create policy "exclusao_administrador" on ordens_servico for delete to authenticated using (public.is_administrador());

create policy "leitura_autenticados" on itens_mao_de_obra for select to authenticated using (true);
create policy "escrita_administrador" on itens_mao_de_obra for insert to authenticated with check (public.is_administrador());
create policy "atualizacao_administrador" on itens_mao_de_obra for update to authenticated using (public.is_administrador()) with check (public.is_administrador());
create policy "exclusao_administrador" on itens_mao_de_obra for delete to authenticated using (public.is_administrador());

create policy "leitura_autenticados" on itens_materiais for select to authenticated using (true);
create policy "escrita_administrador" on itens_materiais for insert to authenticated with check (public.is_administrador());
create policy "atualizacao_administrador" on itens_materiais for update to authenticated using (public.is_administrador()) with check (public.is_administrador());
create policy "exclusao_administrador" on itens_materiais for delete to authenticated using (public.is_administrador());

create policy "leitura_autenticados" on transacoes_financeiras for select to authenticated using (true);
create policy "escrita_administrador" on transacoes_financeiras for insert to authenticated with check (public.is_administrador());
create policy "atualizacao_administrador" on transacoes_financeiras for update to authenticated using (public.is_administrador()) with check (public.is_administrador());
create policy "exclusao_administrador" on transacoes_financeiras for delete to authenticated using (public.is_administrador());

create policy "leitura_autenticados" on notas_fiscais for select to authenticated using (true);
create policy "escrita_administrador" on notas_fiscais for insert to authenticated with check (public.is_administrador());
create policy "atualizacao_administrador" on notas_fiscais for update to authenticated using (public.is_administrador()) with check (public.is_administrador());
create policy "exclusao_administrador" on notas_fiscais for delete to authenticated using (public.is_administrador());
