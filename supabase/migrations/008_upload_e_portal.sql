-- Órbita — bucket de documentos, convites de acesso do cliente ao portal.

-- Bucket privado: nada é público, cada objeto só é acessível pela política abaixo.
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy "documentos_por_escritorio" on storage.objects
  for all
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = escritorio_atual()::text)
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = escritorio_atual()::text);

-- Convite: staff gera um código, o cliente usa esse código para se vincular
-- à própria empresa — sem isso, qualquer pessoa autenticada poderia se
-- autovincular a qualquer empresa só sabendo o UUID dela.
create table convites_cliente (
  id            uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id),
  empresa_id    uuid not null references empresas(id),
  codigo        text not null unique,
  criado_em     timestamptz not null default now(),
  usado_por     uuid references auth.users(id),
  usado_em      timestamptz
);

alter table convites_cliente enable row level security;

create policy isolar_por_escritorio on convites_cliente
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from empresas e where e.id = empresa_id and e.escritorio_id = escritorio_atual())
  );

-- Roda com privilégio elevado só para o passo de vínculo em si — o código só
-- pode ser usado uma vez, e o cliente nunca escolhe a empresa livremente.
create function vincular_cliente_portal(p_codigo text)
returns void
language plpgsql
security definer
set row_security = off
as $$
declare
  v_convite convites_cliente;
begin
  select * into v_convite from convites_cliente where codigo = p_codigo and usado_por is null;

  if v_convite.id is null then
    raise exception 'Código de convite inválido ou já utilizado.';
  end if;

  insert into acessos_cliente (escritorio_id, empresa_id, usuario_auth_id)
  values (v_convite.escritorio_id, v_convite.empresa_id, auth.uid())
  on conflict (empresa_id, usuario_auth_id) do nothing;

  update convites_cliente set usado_por = auth.uid(), usado_em = now() where id = v_convite.id;
end;
$$;
