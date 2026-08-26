-- Órbita — o cliente do portal não tem linha em "usuarios" (não é staff),
-- então escritorio_atual() retorna nulo para ele e a política de isolamento
-- por escritório bloqueia até a leitura da própria linha de acesso.
create policy cliente_ve_seu_proprio_acesso on acessos_cliente
  for select
  using (usuario_auth_id = auth.uid());
