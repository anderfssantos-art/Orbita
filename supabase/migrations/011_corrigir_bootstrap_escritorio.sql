-- Órbita — criar_escritorio_e_usuario estava como security invoker, sujeita
-- a RLS na hora do INSERT. A função vincular_cliente_portal (que já
-- funciona comprovadamente em produção) usa security definer + row_security
-- off para esse mesmo tipo de operação de bootstrap. Alinha as duas ao
-- mesmo padrão comprovado.
create or replace function criar_escritorio_e_usuario(p_nome_escritorio text, p_nome_usuario text)
returns uuid
language plpgsql
security definer
set row_security = off
as $$
declare
  v_escritorio_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if exists (select 1 from usuarios where id = auth.uid()) then
    raise exception 'Este usuário já pertence a um escritório.';
  end if;

  insert into escritorios (nome) values (p_nome_escritorio)
  returning id into v_escritorio_id;

  insert into usuarios (id, escritorio_id, nome, perfil)
  values (auth.uid(), v_escritorio_id, p_nome_usuario, 'gestor');

  return v_escritorio_id;
end;
$$;
