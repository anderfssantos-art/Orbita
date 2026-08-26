-- Órbita — armazena os XMLs fiscais baixados da Receita via NFeDistribuicaoDFe.
-- Cada <docZip> do lote vira uma linha aqui; nsu garante que não duplicamos
-- o mesmo documento em buscas incrementais futuras.
create table documentos_fiscais (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id),
  empresa_id uuid not null references empresas(id),
  nsu text not null,
  schema text not null,
  chave_acesso text,
  xml text not null,
  criado_em timestamptz not null default now(),
  unique (empresa_id, nsu)
);

alter table documentos_fiscais enable row level security;

create policy isolar_por_escritorio on documentos_fiscais
  for all using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());
