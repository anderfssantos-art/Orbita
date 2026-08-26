-- Órbita — mesma causa da migração anterior: o cliente também precisa
-- enxergar os dados básicos da própria empresa (nome, CNPJ) para o portal
-- funcionar, e a política padrão de "empresas" também depende de
-- escritorio_atual(), que é nulo para quem não é staff.
create policy cliente_ve_sua_empresa on empresas
  for select
  using (
    id in (select empresa_id from acessos_cliente where usuario_auth_id = auth.uid())
  );
