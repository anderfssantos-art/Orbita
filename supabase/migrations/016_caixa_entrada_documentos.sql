-- Órbita — caixa de entrada de documentos avulsos.
-- Diferente de "documentos" (que exige uma competência aberta esperando um
-- tipo específico), aqui o cliente/equipe pode subir vários arquivos de uma
-- vez sem que já exista uma pendência criada para eles. A equipe depois
-- vincula cada um a uma pendência real (ou marca como já tratado).
create table caixa_entrada_documentos (
  id                uuid primary key default gen_random_uuid(),
  escritorio_id     uuid not null references escritorios(id),
  empresa_id        uuid not null references empresas(id),
  nome_arquivo      text not null,
  arquivo_url       text not null,
  enviado_por       uuid references usuarios(id),
  status            text not null default 'pendente', -- pendente | vinculado | descartado
  documento_vinculado_id uuid references documentos(id),
  criado_em         timestamptz not null default now()
);

alter table caixa_entrada_documentos enable row level security;

create policy isolar_por_escritorio on caixa_entrada_documentos
  for all
  using (escritorio_id = escritorio_atual())
  with check (
    escritorio_id = escritorio_atual()
    and exists (select 1 from empresas e where e.id = empresa_id and e.escritorio_id = escritorio_atual())
  );

-- Cliente também pode enviar documentos avulsos pela empresa dele, mesmo
-- sem ter usuário de equipe (mesmo padrão de cliente_ve_sua_empresa).
create policy cliente_envia_documento_avulso on caixa_entrada_documentos
  for insert
  with check (
    exists (
      select 1 from acessos_cliente ac
      join empresas e on e.id = ac.empresa_id
      where ac.empresa_id = caixa_entrada_documentos.empresa_id
        and ac.usuario_auth_id = auth.uid()
        and e.escritorio_id = caixa_entrada_documentos.escritorio_id
    )
  );

create policy cliente_ve_seus_documentos_avulsos on caixa_entrada_documentos
  for select
  using (
    exists (
      select 1 from acessos_cliente ac
      where ac.empresa_id = caixa_entrada_documentos.empresa_id
        and ac.usuario_auth_id = auth.uid()
    )
  );
