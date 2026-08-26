-- Órbita — Row Level Security: isolamento por escritório
-- Descobre o escritório do usuário autenticado nesta sessão.
-- security definer + row_security off evita recursão infinita: sem isso, a
-- política de RLS da própria tabela "usuarios" chamaria esta função de novo
-- para decidir se pode ler a linha que a função está tentando ler.
create function escritorio_atual() returns uuid
language sql
stable
security definer
set row_security = off
as $$
  select escritorio_id from usuarios where id = auth.uid();
$$;

-- Habilita RLS e cria a política padrão em cada tabela de negócio
alter table escritorios enable row level security;
alter table usuarios enable row level security;
alter table empresas enable row level security;
alter table competencias enable row level security;
alter table tarefas enable row level security;
alter table documentos enable row level security;
alter table pendencias enable row level security;
alter table eventos enable row level security;
alter table acessos_cliente enable row level security;

create policy isolar_por_escritorio on escritorios
  for all using (id = escritorio_atual());

create policy isolar_por_escritorio on usuarios
  for all using (escritorio_id = escritorio_atual());

create policy isolar_por_escritorio on empresas
  for all using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());

create policy isolar_por_escritorio on competencias
  for all using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());

create policy isolar_por_escritorio on tarefas
  for all using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());

create policy isolar_por_escritorio on documentos
  for all using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());

create policy isolar_por_escritorio on pendencias
  for all using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());

create policy isolar_por_escritorio on eventos
  for all using (escritorio_id = escritorio_atual());

create policy isolar_por_escritorio on acessos_cliente
  for all using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());

-- Portal do cliente: usuário externo só enxerga documentos/competências da própria empresa
create policy cliente_ve_sua_competencia on competencias
  for select
  using (
    empresa_id in (
      select empresa_id from acessos_cliente where usuario_auth_id = auth.uid()
    )
  );

create policy cliente_ve_seus_documentos on documentos
  for select
  using (
    competencia_id in (
      select c.id from competencias c
      join acessos_cliente a on a.empresa_id = c.empresa_id
      where a.usuario_auth_id = auth.uid()
    )
  );

create policy cliente_ve_suas_pendencias on pendencias
  for select
  using (
    competencia_id in (
      select c.id from competencias c
      join acessos_cliente a on a.empresa_id = c.empresa_id
      where a.usuario_auth_id = auth.uid()
    )
  );
