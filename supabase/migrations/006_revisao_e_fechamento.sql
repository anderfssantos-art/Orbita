-- Órbita — rastreia quem concluiu a tarefa, para a regra "revisor ≠ executor"
-- ser verificável no servidor, não só sugerida na interface.
alter table tarefas add column concluida_por_id uuid references usuarios(id);
