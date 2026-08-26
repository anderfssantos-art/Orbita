-- Órbita — tarefas, documentos, pendências e trilha de auditoria
create table tarefas (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  competencia_id    uuid not null references competencias(id),
  nome              text not null,
  setor             text not null,
  responsavel_id    uuid references usuarios(id),
  predecessora_id   uuid references tarefas(id),
  critica           boolean not null default false,
  prazo             date,
  status            text not null default 'pendente',
  aprovada_por_id   uuid references usuarios(id) -- revisão em 4 olhos
);

create table documentos (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  competencia_id    uuid not null references competencias(id),
  tipo              text not null,
  origem            text not null, -- portal | upload_interno | busca_automatica
  arquivo_url       text,
  status            text not null default 'faltando',
  recebido_em       timestamptz
);

create table pendencias (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  competencia_id    uuid not null references competencias(id),
  titulo            text not null,
  descricao         text,
  severidade        text not null, -- alta | media | baixa
  responsavel_id    uuid references usuarios(id),
  status            text not null default 'aberta',
  criada_em         timestamptz not null default now(),
  resolvida_em      timestamptz
);

-- Trilha de auditoria: preenchida por trigger, nunca pela aplicação
create table eventos (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  usuario_id        uuid references usuarios(id),
  entidade          text not null,
  entidade_id       uuid not null,
  acao              text not null,
  detalhe           jsonb,
  criado_em         timestamptz not null default now()
);

-- Acessos do cliente ao portal (usuário do cliente, não da equipe interna)
create table acessos_cliente (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  empresa_id        uuid not null references empresas(id),
  usuario_auth_id   uuid not null references auth.users(id),
  criado_em         timestamptz not null default now(),
  unique (empresa_id, usuario_auth_id)
);
