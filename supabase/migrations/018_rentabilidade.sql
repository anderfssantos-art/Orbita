-- Órbita — Fase 8: base de dados para rentabilidade/carga de trabalho.
-- Nada disso existia até aqui: tarefas não tinham data de criação nem de
-- conclusão (impossível medir tempo real de entrega), e empresas não
-- tinham valor de honorário. Sem isso, "custo e margem por cliente" seria
-- só enfeite — nenhum número seria de verdade.
alter table empresas add column honorario_mensal numeric(12,2);

alter table tarefas add column criado_em timestamptz not null default now();
alter table tarefas add column concluida_em timestamptz;
