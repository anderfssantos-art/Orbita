-- Órbita — tabelas centrais
-- Escritório: raiz de tudo
create table escritorios (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  plano         text not null default 'trial',
  criado_em     timestamptz not null default now()
);

-- Usuário: sempre amarrado a um escritório
create table usuarios (
  id            uuid primary key references auth.users(id),
  escritorio_id uuid not null references escritorios(id),
  nome          text not null,
  perfil        text not null, -- gestor | responsavel | revisor | atendimento
  setor         text,          -- fiscal | contabil | dp | null
  criado_em     timestamptz not null default now()
);

-- Empresa: cliente do escritório
create table empresas (
  id                 uuid primary key default gen_random_uuid(),
  escritorio_id      uuid not null references escritorios(id),
  cnpj               text not null,
  razao_social       text not null,
  regime_tributario  text not null,
  status             text not null default 'ativa',
  criado_em          timestamptz not null default now(),
  unique (escritorio_id, cnpj)
);

-- Competência: nó central do fluxo mensal
create table competencias (
  id            uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id),
  empresa_id    uuid not null references empresas(id),
  referencia    date not null, -- primeiro dia do mês de competência
  status        text not null default 'aberta',
  fechada_em    timestamptz,
  unique (empresa_id, referencia)
);
