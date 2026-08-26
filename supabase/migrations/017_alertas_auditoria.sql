-- Órbita — Fase 6: motor de regras determinísticas de auditoria/conformidade.
-- Cada regra vive como código versionado (src/lib/regras-auditoria.ts), não
-- como configuração editável por UI ainda — dá rastreabilidade real (git
-- blame) de quando e por que uma regra mudou. Esta tabela só guarda o
-- resultado de rodar as regras contra uma competência.
create table alertas_auditoria (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  competencia_id    uuid not null references competencias(id),
  regra_codigo      text not null,
  titulo            text not null,
  descricao         text not null,
  severidade        text not null, -- alta | media | baixa
  acao_recomendada  text not null,
  status            text not null default 'aberto', -- aberto | resolvido | ignorado
  criado_em         timestamptz not null default now(),
  tratado_em        timestamptz,
  unique (competencia_id, regra_codigo)
);

alter table alertas_auditoria enable row level security;

create policy isolar_por_escritorio on alertas_auditoria
  for all
  using (escritorio_id = escritorio_atual())
  with check (escritorio_id = escritorio_atual());
