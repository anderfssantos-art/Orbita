-- Órbita — catálogo de serviços e vínculo com empresas
create table servicos (
  id                     uuid primary key default gen_random_uuid(),
  escritorio_id          uuid not null references escritorios(id),
  nome                   text not null,
  setor                  text not null, -- fiscal | contabil | dp
  critica                boolean not null default false,
  documentos_necessarios text[] not null default '{}',
  criado_em              timestamptz not null default now()
);

-- Quais serviços cada empresa contratou
create table empresa_servicos (
  id            uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id),
  empresa_id    uuid not null references empresas(id),
  servico_id    uuid not null references servicos(id),
  unique (empresa_id, servico_id)
);

-- Liga cada tarefa gerada ao serviço que a originou
alter table tarefas add column servico_id uuid references servicos(id);

alter table servicos enable row level security;
alter table empresa_servicos enable row level security;

create policy isolar_por_escritorio on servicos
  for all using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());

create policy isolar_por_escritorio on empresa_servicos
  for all using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());
