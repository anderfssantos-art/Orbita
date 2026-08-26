-- Órbita — trilha de auditoria de verdade.
-- A tabela eventos existe desde a migração 002 com o comentário "preenchida
-- por trigger, nunca pela aplicação" — mas nenhum trigger nunca foi criado.
-- Estava vazia desde o início do projeto. Esta migração corrige isso.
create or replace function registrar_evento()
returns trigger
language plpgsql
security definer
set row_security = off
as $$
declare
  v_escritorio_id uuid;
  v_usuario_id uuid;
  v_acao text;
  v_detalhe jsonb;
  v_entidade_id uuid;
begin
  if TG_OP = 'INSERT' then
    v_acao := 'criado';
    v_escritorio_id := NEW.escritorio_id;
    v_detalhe := to_jsonb(NEW);
    v_entidade_id := NEW.id;
  elsif TG_OP = 'UPDATE' then
    v_acao := 'atualizado';
    v_escritorio_id := NEW.escritorio_id;
    v_detalhe := jsonb_build_object('antes', to_jsonb(OLD), 'depois', to_jsonb(NEW));
    v_entidade_id := NEW.id;
  else
    v_acao := 'excluido';
    v_escritorio_id := OLD.escritorio_id;
    v_detalhe := to_jsonb(OLD);
    v_entidade_id := OLD.id;
  end if;

  -- auth.uid() pode ser um cliente do portal, que não tem linha em
  -- usuarios — nesse caso grava usuario_id nulo em vez de violar a FK.
  select id into v_usuario_id from usuarios where id = auth.uid();

  insert into eventos (escritorio_id, usuario_id, entidade, entidade_id, acao, detalhe)
  values (v_escritorio_id, v_usuario_id, TG_TABLE_NAME, v_entidade_id, v_acao, v_detalhe);

  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_evento_empresas after insert or update or delete on empresas for each row execute function registrar_evento();
create trigger trg_evento_competencias after insert or update or delete on competencias for each row execute function registrar_evento();
create trigger trg_evento_tarefas after insert or update or delete on tarefas for each row execute function registrar_evento();
create trigger trg_evento_documentos after insert or update or delete on documentos for each row execute function registrar_evento();
create trigger trg_evento_pendencias after insert or update or delete on pendencias for each row execute function registrar_evento();
create trigger trg_evento_alertas_auditoria after insert or update or delete on alertas_auditoria for each row execute function registrar_evento();
