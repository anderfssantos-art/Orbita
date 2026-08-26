import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VincularServicoForm } from "./vincular-servico-form";
import { AbrirCompetenciaButton } from "./abrir-competencia-button";
import { ActionButton } from "./action-button";
import { desvincularServico } from "@/app/actions/servicos";
import {
  marcarTarefaConcluida,
  aprovarTarefa,
  rodarPreConferencia,
  fecharCompetencia,
} from "@/app/actions/competencias";
import { resolverPendencia } from "@/app/actions/pendencias";
import { rodarAuditoria, tratarAlerta } from "@/app/actions/auditoria";
import { DocumentoUpload } from "./documento-upload";
import { GerarConviteButton } from "./gerar-convite-button";
import { CertificadoUpload } from "./certificado-upload";
import { BuscarXmlButton } from "./buscar-xml-button";
import { UploadEmLote } from "./upload-em-lote";
import { CaixaEntradaItem } from "./caixa-entrada-item";
import { ResponsavelSelect } from "./responsavel-select";
import { HonorarioInput } from "./honorario-input";
import { FuncionarioForm } from "./funcionario-form";
import { FuncionarioItem } from "./funcionario-item";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";

const setorLabel: Record<string, string> = {
  fiscal: "Fiscal",
  contabil: "Contábil",
  dp: "Departamento Pessoal",
};

const severidadeStyle: Record<string, string> = {
  alta: "bg-red-100 text-red-700",
  media: "bg-amber-100 text-amber-700",
  baixa: "bg-zinc-100 text-zinc-600",
};

export default async function EmpresaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const usuario = await usuarioAtual(supabase);

  const { data: colaboradores } = usuario
    ? await supabase.from("usuarios").select("id, nome").eq("escritorio_id", usuario.escritorio_id).order("nome")
    : { data: [] };

  // As quatro consultas abaixo só dependem do id da rota, não umas das
  // outras — rodam em paralelo em vez de uma esperar a outra terminar.
  const [
    { data: empresa },
    { data: todosServicos },
    { data: contratados },
    { data: competencias },
    { data: certificados },
    { data: caixaEntrada },
    { data: funcionarios },
  ] = await Promise.all([
    supabase
      .from("empresas")
      .select("id, cnpj, razao_social, regime_tributario, status, honorario_mensal")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("servicos").select("id, nome, setor").order("nome"),
    supabase
      .from("empresa_servicos")
      .select("servico_id, servicos(id, nome, setor, critica)")
      .eq("empresa_id", id),
    supabase
      .from("competencias")
      .select("id, referencia, status")
      .eq("empresa_id", id)
      .order("referencia", { ascending: false }),
    supabase
      .from("certificados_digitais")
      .select("id, nome_arquivo, validade, criado_em")
      .eq("empresa_id", id)
      .order("criado_em", { ascending: false })
      .limit(1),
    supabase
      .from("caixa_entrada_documentos")
      .select("id, nome_arquivo, criado_em")
      .eq("empresa_id", id)
      .eq("status", "pendente")
      .order("criado_em", { ascending: false }),
    supabase
      .from("funcionarios")
      .select("id, nome, status, data_admissao")
      .eq("empresa_id", id)
      .order("nome"),
  ]);

  if (!empresa) notFound();

  const idsFuncionarios = (funcionarios ?? []).map((f) => f.id);
  const { data: feriasRegistradas } =
    idsFuncionarios.length > 0
      ? await supabase.from("ferias").select("funcionario_id").in("funcionario_id", idsFuncionarios)
      : { data: [] };
  const funcionariosComFerias = new Set((feriasRegistradas ?? []).map((f) => f.funcionario_id));

  const servicosContratados = (contratados ?? [])
    .map((row) => row.servicos)
    .filter(Boolean) as unknown as {
    id: string;
    nome: string;
    setor: string;
    critica: boolean;
  }[];

  const idsContratados = new Set(servicosContratados.map((s) => s.id));
  const servicosDisponiveis = (todosServicos ?? []).filter(
    (s) => !idsContratados.has(s.id)
  );

  const competenciaAtual = competencias?.[0];

  // Estas quatro só dependem da competência acima, mas não umas das outras.
  const [{ data: tarefas }, { data: documentos }, { data: pendencias }, { data: alertas }] =
    competenciaAtual
      ? await Promise.all([
          supabase
            .from("tarefas")
            .select("id, nome, setor, critica, exige_revisao_4_olhos, status, concluida_por_id, aprovada_por_id, responsavel_id")
            .eq("competencia_id", competenciaAtual.id)
            .order("nome"),
          supabase
            .from("documentos")
            .select("id, tipo, status, arquivo_url")
            .eq("competencia_id", competenciaAtual.id)
            .order("tipo"),
          supabase
            .from("pendencias")
            .select("id, titulo, descricao, severidade, status")
            .eq("competencia_id", competenciaAtual.id)
            .order("criada_em", { ascending: false }),
          supabase
            .from("alertas_auditoria")
            .select("id, titulo, descricao, severidade, acao_recomendada, status")
            .eq("competencia_id", competenciaAtual.id)
            .eq("status", "aberto")
            .order("severidade"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const pendenciasAbertas = (pendencias ?? []).filter((p) => p.status === "aberta");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/empresas" className="text-sm text-emerald-700">
            ← Empresas
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {empresa.razao_social}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {empresa.cnpj} · {empresa.regime_tributario}
          </p>
          <div className="mt-2">
            <HonorarioInput empresaId={id} valorAtual={empresa.honorario_mensal} />
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Serviços contratados</h2>

        {servicosContratados.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {servicosContratados.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
              >
                <span>
                  {s.nome}{" "}
                  <span className="text-zinc-500">
                    · {setorLabel[s.setor] ?? s.setor}
                  </span>
                  {s.critica && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      crítico
                    </span>
                  )}
                </span>
                <form action={desvincularServico}>
                  <input type="hidden" name="empresaId" value={id} />
                  <input type="hidden" name="servicoId" value={s.id} />
                  <button className="text-xs text-red-600 hover:underline">
                    remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            Nenhum serviço contratado ainda —{" "}
            <Link href="/servicos" className="text-emerald-700">
              veja o catálogo
            </Link>
            .
          </p>
        )}

        <VincularServicoForm empresaId={id} servicosDisponiveis={servicosDisponiveis ?? []} />
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Competência atual</h2>
          {!competenciaAtual && <AbrirCompetenciaButton empresaId={id} />}
        </div>

        {competenciaAtual ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-600">
                Referência{" "}
                <span className="font-mono">{competenciaAtual.referencia}</span> · status{" "}
                <span
                  className={
                    "font-semibold " +
                    (competenciaAtual.status === "fechada" ? "text-emerald-700" : "text-zinc-900")
                  }
                >
                  {competenciaAtual.status}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/empresas/${id}/exportar?competenciaId=${competenciaAtual.id}`}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Exportar CSV
                </a>
                {competenciaAtual.status === "aberta" && (
                  <>
                    <ActionButton
                      action={rodarPreConferencia}
                      fields={{ competenciaId: competenciaAtual.id, empresaId: id }}
                      label="Rodar pré-conferência"
                      pendingLabel="Conferindo..."
                    />
                    <ActionButton
                      action={rodarAuditoria}
                      fields={{ competenciaId: competenciaAtual.id, empresaId: id }}
                      label="Rodar auditoria"
                      pendingLabel="Auditando..."
                    />
                    <ActionButton
                      action={fecharCompetencia}
                      fields={{ competenciaId: competenciaAtual.id, empresaId: id }}
                      label="Fechar competência"
                      pendingLabel="Fechando..."
                      variant="primary"
                    />
                  </>
                )}
              </div>
            </div>

            {pendenciasAbertas.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Pendências abertas ({pendenciasAbertas.length})
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {pendenciasAbertas.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{p.titulo}</span>
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-xs font-semibold " +
                              (severidadeStyle[p.severidade] ?? "bg-zinc-100 text-zinc-600")
                            }
                          >
                            {p.severidade}
                          </span>
                        </div>
                        {p.descricao && (
                          <p className="mt-0.5 text-xs text-zinc-600">{p.descricao}</p>
                        )}
                      </div>
                      <form action={resolverPendencia}>
                        <input type="hidden" name="pendenciaId" value={p.id} />
                        <input type="hidden" name="empresaId" value={id} />
                        <button className="whitespace-nowrap text-xs font-semibold text-emerald-700 hover:underline">
                          resolver
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {alertas && alertas.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Alertas de auditoria ({alertas.length})
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {alertas.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-col gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{a.titulo}</span>
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-xs font-semibold " +
                              (severidadeStyle[a.severidade] ?? "bg-zinc-100 text-zinc-600")
                            }
                          >
                            {a.severidade}
                          </span>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <form action={tratarAlerta}>
                            <input type="hidden" name="alertaId" value={a.id} />
                            <input type="hidden" name="empresaId" value={id} />
                            <input type="hidden" name="status" value="resolvido" />
                            <button className="whitespace-nowrap text-xs font-semibold text-emerald-700 hover:underline">
                              resolver
                            </button>
                          </form>
                          <form action={tratarAlerta}>
                            <input type="hidden" name="alertaId" value={a.id} />
                            <input type="hidden" name="empresaId" value={id} />
                            <input type="hidden" name="status" value="ignorado" />
                            <button className="whitespace-nowrap text-xs text-zinc-500 hover:underline">
                              ignorar
                            </button>
                          </form>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600">{a.descricao}</p>
                      <p className="text-xs font-medium text-zinc-700">→ {a.acao_recomendada}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Tarefas geradas ({tarefas?.length ?? 0})
              </h3>
              <ul className="flex flex-col gap-1.5">
                {tarefas?.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span className={t.status === "concluida" ? "text-zinc-400 line-through" : ""}>
                      {t.nome}{" "}
                      <span className="text-zinc-500">· {setorLabel[t.setor] ?? t.setor}</span>
                      {t.critica && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          crítica{t.aprovada_por_id ? " · aprovada" : ""}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <ResponsavelSelect
                        tarefaId={t.id}
                        empresaId={id}
                        responsavelAtualId={t.responsavel_id}
                        colaboradores={colaboradores ?? []}
                      />
                      {t.status !== "concluida" && (
                        <form action={marcarTarefaConcluida}>
                          <input type="hidden" name="tarefaId" value={t.id} />
                          <input type="hidden" name="empresaId" value={id} />
                          <button className="text-xs font-semibold text-emerald-700 hover:underline">
                            concluir
                          </button>
                        </form>
                      )}
                      {t.status === "concluida" && t.critica && t.exige_revisao_4_olhos && !t.aprovada_por_id && (
                        <ActionButton
                          action={aprovarTarefa}
                          fields={{ tarefaId: t.id, empresaId: id }}
                          label="aprovar (4 olhos)"
                          pendingLabel="Aprovando..."
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Documentos esperados ({documentos?.length ?? 0})
              </h3>
              <ul className="flex flex-col gap-1.5">
                {documentos?.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span>{d.tipo}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-semibold " +
                          (d.status === "recebido"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700")
                        }
                      >
                        {d.status}
                      </span>
                      {d.status !== "recebido" && (
                        <DocumentoUpload
                          documentoId={d.id}
                          competenciaId={competenciaAtual.id}
                          empresaId={id}
                          tipo={d.tipo}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500">
            Nenhuma competência aberta este mês.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Departamento Pessoal</h2>
        <FuncionarioForm empresaId={id} />
        {funcionarios && funcionarios.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {funcionarios.map((f) => (
              <FuncionarioItem
                key={f.id}
                funcionarioId={f.id}
                empresaId={id}
                nome={f.nome}
                status={f.status}
                dataAdmissao={f.data_admissao}
                temFerias={funcionariosComFerias.has(f.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Nenhum funcionário cadastrado ainda.</p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Caixa de entrada de documentos</h2>
          <p className="mt-0.5 text-sm text-zinc-600">
            Envie vários arquivos de uma vez, mesmo sem uma pendência aberta esperando por eles. Depois é só vincular cada um ao documento certo.
          </p>
        </div>
        <UploadEmLote empresaId={id} />
        {caixaEntrada && caixaEntrada.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {caixaEntrada.map((item) => (
              <CaixaEntradaItem
                key={item.id}
                itemId={item.id}
                empresaId={id}
                nomeArquivo={item.nome_arquivo}
                documentosPendentes={(documentos ?? [])
                  .filter((d) => d.status !== "recebido")
                  .map((d) => ({ id: d.id, tipo: d.tipo }))}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Portal do cliente</h2>
        <p className="text-sm text-zinc-600">
          Gere um convite para o responsável desta empresa acompanhar competências, pendências e documentos sem precisar falar com o escritório.
        </p>
        <GerarConviteButton empresaId={id} />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Certificado digital (A1)</h2>
        <p className="text-sm text-zinc-600">
          Necessário para a busca automática de documentos fiscais. O arquivo e a senha ficam guardados num cofre criptografado — nunca em texto simples.
        </p>
        <CertificadoUpload empresaId={id} certificadoAtual={certificados?.[0] ?? null} />
        {certificados?.[0] && (
          <BuscarXmlButton empresaId={id} certificadoId={certificados[0].id} />
        )}
      </section>
    </main>
  );
}
