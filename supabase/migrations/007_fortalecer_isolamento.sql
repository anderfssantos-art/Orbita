-- Órbita — fecha uma brecha real: até aqui, o WITH CHECK de cada tabela só
-- validava o escritorio_id da própria linha nova, não que as chaves
-- estrangeiras (empresa_id, competencia_id, servico_id) apontadas por essa
-- linha também pertencessem ao mesmo escritório. Um usuário autenticado que
-- soubesse o UUID de uma empresa/serviço de outro escritório podia referenciá-lo
-- ao criar uma competência ou vincular um serviço, cruzando tenants.
-- Isso corrige na camada mais profunda possível: nenhum código de aplicação,
-- presente ou futuro, consegue burlar essa validação.

drop policy if exists isolar_por_escritorio on competencias;
create policy isolar_por_escritorio on competencias
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from empresas e where e.id = empresa_id and e.escritorio_id = escritorio_atual())
  );

drop policy if exists isolar_por_escritorio on tarefas;
create policy isolar_por_escritorio on tarefas
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from competencias c where c.id = competencia_id and c.escritorio_id = escritorio_atual())
    and (servico_id is null or exists (select 1 from servicos s where s.id = servico_id and s.escritorio_id = escritorio_atual()))
  );

drop policy if exists isolar_por_escritorio on documentos;
create policy isolar_por_escritorio on documentos
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from competencias c where c.id = competencia_id and c.escritorio_id = escritorio_atual())
  );

drop policy if exists isolar_por_escritorio on pendencias;
create policy isolar_por_escritorio on pendencias
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from competencias c where c.id = competencia_id and c.escritorio_id = escritorio_atual())
  );

drop policy if exists isolar_por_escritorio on empresa_servicos;
create policy isolar_por_escritorio on empresa_servicos
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from empresas e where e.id = empresa_id and e.escritorio_id = escritorio_atual())
    and exists (select 1 from servicos s where s.id = servico_id and s.escritorio_id = escritorio_atual())
  );

-- Une a criação do escritório e do usuário gestor numa única transação
-- atômica: se qualquer parte falhar, tudo desfaz — não sobra mais um
-- escritório sem usuário nem um usuário sem escritório.
create function criar_escritorio_e_usuario(p_nome_escritorio text, p_nome_usuario text)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_escritorio_id uuid;
begin
  insert into escritorios (nome) values (p_nome_escritorio)
  returning id into v_escritorio_id;

  insert into usuarios (id, escritorio_id, nome, perfil)
  values (auth.uid(), v_escritorio_id, p_nome_usuario, 'gestor');

  return v_escritorio_id;
end;
$$;
