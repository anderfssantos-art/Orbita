-- Órbita — infraestrutura para a busca automática de XML (NFeDistribuicaoDFe).
-- Guarda o ponteiro de progresso (NSU) para não reprocessar tudo a cada
-- busca — a Receita entrega os documentos em lotes ordenados por NSU.
alter table certificados_digitais add column ultimo_nsu text not null default '000000000000000';

-- Único ponto que devolve o certificado decriptografado — só na hora de
-- usar, nunca fica em cache nem é persistido fora do Vault. Verifica
-- explicitamente que quem pede pertence ao mesmo escritório do certificado.
create or replace function obter_certificado_decriptografado(p_certificado_id uuid)
returns table (arquivo_base64 text, senha text, ultimo_nsu text)
language plpgsql
security definer
set row_security = off
as $$
declare
  v_registro certificados_digitais;
  v_escritorio_usuario uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select escritorio_id into v_escritorio_usuario from usuarios where id = auth.uid();

  select * into v_registro from certificados_digitais where id = p_certificado_id;

  if v_registro.id is null or v_registro.escritorio_id <> v_escritorio_usuario then
    raise exception 'Certificado não encontrado ou sem permissão.';
  end if;

  return query
    select
      (select decrypted_secret from vault.decrypted_secrets where id = v_registro.vault_arquivo_id),
      (select decrypted_secret from vault.decrypted_secrets where id = v_registro.vault_senha_id),
      v_registro.ultimo_nsu;
end;
$$;
