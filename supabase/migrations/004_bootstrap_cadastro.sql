-- Órbita — permite o momento de "ovo e galinha" do cadastro: um usuário
-- recém-autenticado ainda não tem linha em "usuarios", então
-- escritorio_atual() retorna null e a política padrão bloqueia tudo.
-- Estas duas políticas adicionais liberam exatamente os dois inserts do
-- fluxo de cadastro, e nada além disso.

create policy bootstrap_criar_escritorio on escritorios
  for insert
  with check (not exists (select 1 from usuarios where id = auth.uid()));

create policy bootstrap_criar_usuario on usuarios
  for insert
  with check (id = auth.uid());
