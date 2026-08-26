-- Órbita — separa "crítico" (informativo) de "exige revisão em 4 olhos"
-- (bloqueia o fechamento). Escritórios de uma pessoa só ficavam travados
-- indefinidamente em qualquer serviço crítico, sem alternativa.
alter table servicos add column exige_revisao_4_olhos boolean not null default true;
alter table tarefas add column exige_revisao_4_olhos boolean not null default true;
