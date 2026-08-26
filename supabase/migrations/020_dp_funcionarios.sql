-- Órbita — base de Departamento Pessoal: funcionários e férias.
-- Sem isso, nenhuma regra de DP (férias vencidas, admissão incompleta,
-- divergência de folha) tem dado real pra sustentar — só existiam
-- metadados de tarefa até aqui, nada da vida do funcionário em si.
create table funcionarios (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  empresa_id        uuid not null references empresas(id),
  nome              text not null,
  cpf               text not null,
  data_admissao     date not null,
  data_demissao     date,
  status            text not null default 'ativo', -- ativo | demitido
  criado_em         timestamptz not null default now(),
  unique (empresa_id, cpf)
);

alter table funcionarios enable row level security;

create policy isolar_por_escritorio on funcionarios
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from empresas e where e.id = empresa_id and e.escritorio_id = escritorio_atual())
  );

-- Um registro por período de férias efetivamente gozado — não é o
-- período aquisitivo, é o gozo em si (quando o funcionário realmente saiu
-- de férias).
create table ferias (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  funcionario_id    uuid not null references funcionarios(id),
  inicio            date not null,
  fim               date not null,
  criado_em         timestamptz not null default now()
);

alter table ferias enable row level security;

create policy isolar_por_escritorio on ferias
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from funcionarios f where f.id = funcionario_id and f.escritorio_id = escritorio_atual())
  );
