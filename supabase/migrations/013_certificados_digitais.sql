-- Órbita — armazenamento seguro de certificados digitais A1.
-- O arquivo e a senha NUNCA ficam numa tabela normal: vão para o Supabase
-- Vault (criptografado com chave gerida fora do banco). Esta tabela guarda
-- só metadados — nome do arquivo, validade, quando foi enviado — e uma
-- referência aos segredos no Vault, nunca o conteúdo sensível em si.
create extension if not exists supabase_vault;

create table certificados_digitais (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  empresa_id        uuid not null references empresas(id),
  nome_arquivo      text not null,
  validade          date,
  vault_arquivo_id  uuid not null,
  vault_senha_id    uuid not null,
  enviado_por       uuid references usuarios(id),
  criado_em         timestamptz not null default now()
);

alter table certificados_digitais enable row level security;

-- Só metadados são legíveis pela aplicação normal — o conteúdo do Vault
-- não é exposto por nenhuma política aqui.
create policy isolar_por_escritorio on certificados_digitais
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from empresas e where e.id = empresa_id and e.escritorio_id = escritorio_atual())
  );

-- Único ponto de entrada para gravar um certificado: recebe o conteúdo já
-- em base64 e a senha, grava os dois no Vault (nunca na tabela) e devolve
-- só o id do registro de metadados. security definer + row_security off
-- porque grava em vault.secrets, que a role "authenticated" não acessa
-- diretamente — e não deve.
create or replace function salvar_certificado_digital(
  p_empresa_id uuid,
  p_nome_arquivo text,
  p_arquivo_base64 text,
  p_senha text,
  p_validade date
)
returns uuid
language plpgsql
security definer
set row_security = off
as $$
declare
  v_escritorio_id uuid;
  v_certificado_id uuid;
  v_vault_arquivo_id uuid;
  v_vault_senha_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select escritorio_id into v_escritorio_id from usuarios where id = auth.uid();
  if v_escritorio_id is null then
    raise exception 'Usuário sem escritório vinculado.';
  end if;

  if not exists (
    select 1 from empresas where id = p_empresa_id and escritorio_id = v_escritorio_id
  ) then
    raise exception 'Empresa não pertence ao seu escritório.';
  end if;

  v_vault_arquivo_id := vault.create_secret(p_arquivo_base64, p_nome_arquivo || '-arquivo');
  v_vault_senha_id := vault.create_secret(p_senha, p_nome_arquivo || '-senha');

  insert into certificados_digitais (
    escritorio_id, empresa_id, nome_arquivo, validade,
    vault_arquivo_id, vault_senha_id, enviado_por
  ) values (
    v_escritorio_id, p_empresa_id, p_nome_arquivo, p_validade,
    v_vault_arquivo_id, v_vault_senha_id, auth.uid()
  )
  returning id into v_certificado_id;

  return v_certificado_id;
end;
$$;

-- Remove o certificado E os segredos do Vault juntos — nunca deixa um
-- segredo órfão guardado sem nenhum registro visível apontando pra ele.
create or replace function remover_certificado_digital(p_certificado_id uuid)
returns void
language plpgsql
security definer
set row_security = off
as $$
declare
  v_registro certificados_digitais;
begin
  select * into v_registro from certificados_digitais where id = p_certificado_id;

  if v_registro.id is null then
    raise exception 'Certificado não encontrado.';
  end if;

  if v_registro.escritorio_id <> (select escritorio_id from usuarios where id = auth.uid()) then
    raise exception 'Sem permissão para remover este certificado.';
  end if;

  delete from vault.secrets where id in (v_registro.vault_arquivo_id, v_registro.vault_senha_id);
  delete from certificados_digitais where id = p_certificado_id;
end;
$$;
