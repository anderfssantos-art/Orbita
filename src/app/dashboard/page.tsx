import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { planoDe } from "@/lib/planos";

const setorLabel: Record<string, string> = {
  fiscal: "Fiscal",
  contabil: "Contábil",
  dp: "Departamento Pessoal",
};

// Mesmas cores da referência: fiscal e DP em azul, contábil em laranja —
// não é uma preferência estética arbitrária, é o que foi pedido pra bater
// com o modelo exato que o Anderson mandou.
const setorCor: Record<string, string> = {
  fiscal: "bg-blue-600",
  contabil: "bg-orange-500",
  dp: "bg-blue-600",
};

const severidadeStyle: Record<string, string> = {
  alta: "bg-blue-100 text-blue-700",
  media: "bg-amber-100 text-amber-700",
  baixa: "bg-zinc-100 text-zinc-600",
};

const acoesRapidas = [
  { icone: "📥", label: "Abrir empresa", href: "/empresas" },
  { icone: "📤", label: "Importar documentos", href: "/empresas" },
  { icone: "💬", label: "Catálogo de serviços", href: "/servicos" },
  { icone: "🔍", label: "Reforma Tributária", href: "/reforma-tributaria" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const usuario = await usuarioAtual(supabase);

  const { data: escritorio } = usuario
    ? await supabase.from("escritorios").select("nome, plano").eq("id", usuario.escritorio_id).maybeSingle()
    : { data: null };
  const plano = planoDe(escritorio?.plano ?? "trial");

  const [
    { count: totalEmpresas },
    { count: totalServicos },
    { count: totalServicosVinculados },
    { data: competencias },
    { count: totalClientesConvidados },
    { data: tarefas },
    { data: documentos },
    { data: alertasAbertos },
    { data: pendenciasAbertas },
  ] = await Promise.all([
    supabase.from("empresas").select("id", { count: "exact", head: true }),
    supabase.from("servicos").select("id", { count: "exact", head: true }),
    supabase.from("empresa_servicos").select("empresa_id", { count: "exact", head: true }),
    supabase.from("competencias").select("id, status"),
    supabase.from("acessos_cliente").select("id", { count: "exact", head: true }),
    supabase.from("tarefas").select("setor, status, critica"),
    supabase.from("documentos").select("status"),
    supabase
      .from("alertas_auditoria")
      .select("id, titulo, descricao, severidade, acao_recomendada, regra_codigo, competencias(referencia, empresas(id, razao_social))")
      .eq("status", "aberto"),
    supabase
      .from("pendencias")
      .select("id, titulo, severidade, responsavel_id, usuarios(nome), competencias(referencia, empresas(id, razao_social))")
      .eq("status", "aberta"),
  ]);

  const passosOnboarding = [
    { feito: (totalEmpresas ?? 0) > 0, texto: "Cadastre a primeira empresa", href: "/empresas" },
    { feito: (totalServicos ?? 0) > 0, texto: "Adicione um serviço ao catálogo", href: "/servicos" },
    { feito: (totalServicosVinculados ?? 0) > 0, texto: "Contrate um serviço para uma empresa", href: "/empresas" },
    { feito: (competencias?.length ?? 0) > 0, texto: "Abra a primeira competência", href: "/empresas" },
    { feito: (totalClientesConvidados ?? 0) > 0, texto: "Convide um cliente para o portal", href: "/empresas" },
  ];
  const onboardingCompleto = passosOnboarding.every((p) => p.feito);

  const totalCompetencias = competencias?.length ?? 0;
  const competenciasFechadas = (competencias ?? []).filter((c) => c.status === "fechada").length;
  const pctCompetenciasFechadas = totalCompetencias > 0 ? Math.round((competenciasFechadas / totalCompetencias) * 100) : null;

  const totalDocumentos = documentos?.length ?? 0;
  const documentosRecebidos = (documentos ?? []).filter((d) => d.status === "recebido").length;
  const pctDocumentosRecebidos = totalDocumentos > 0 ? Math.round((documentosRecebidos / totalDocumentos) * 100) : null;

  const tarefasCriticas = (tarefas ?? []).filter((t) => t.critica);
  const tarefasCriticasPendentes = tarefasCriticas.filter((t) => t.status !== "concluida").length;

  const porSetor = (["fiscal", "contabil", "dp"] as const).map((setor) => {
    const doSetor = (tarefas ?? []).filter((t) => t.setor === setor);
    const concluidas = doSetor.filter((t) => t.status === "concluida").length;
    const criticasPendentes = doSetor.filter((t) => t.critica && t.status !== "concluida").length;
    const pct = doSetor.length > 0 ? Math.round((concluidas / doSetor.length) * 100) : null;
    return { setor, total: doSetor.length, concluidas, criticasPendentes, pct };
  });

  const codigosAbertos = (alertasAbertos ?? []).reduce(
    (acc, a) => acc.set(a.regra_codigo, (acc.get(a.regra_codigo) ?? 0) + 1),
    new Map<string, number>()
  );

  const prioridades = [
    ...(alertasAbertos ?? []).map((a) => {
      const c = a.competencias as unknown as { referencia: string; empresas: { id: string; razao_social: string } } | null;
      return {
        id: a.id,
        empresa: c?.empresas?.razao_social ?? "—",
        empresaId: c?.empresas?.id,
        ocorrencia: a.titulo,
        severidade: a.severidade,
        referencia: c?.referencia,
        responsavel: null as string | null,
      };
    }),
    ...(pendenciasAbertas ?? []).map((p) => {
      const c = p.competencias as unknown as { referencia: string; empresas: { id: string; razao_social: string } } | null;
      const resp = p.usuarios as unknown as { nome: string } | null;
      return {
        id: p.id,
        empresa: c?.empresas?.razao_social ?? "—",
        empresaId: c?.empresas?.id,
        ocorrencia: p.titulo,
        severidade: p.severidade,
        referencia: c?.referencia,
        responsavel: resp?.nome ?? null,
      };
    }),
  ]
    .sort((a, b) => (a.severidade === "alta" ? -1 : b.severidade === "alta" ? 1 : 0))
    .slice(0, 8);

  const competenciaReferencia = new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-mono text-sm font-bold text-white shadow-sm">
              Ω
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Órbita</h1>
              <p className="text-xs text-zinc-500">Visão executiva · competência {competenciaReferencia}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5">
              <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Painel do escritório</span>
              <Link href="/empresas" className="rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50">
                Painel do cliente
              </Link>
            </div>
            <Link href="/ajuda" className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Ajuda</Link>
            <Link href="/eventos" className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Trilha de auditoria</Link>
            <Link href="/empresas" className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Empresas</Link>
          </div>
        </div>

        {!onboardingCompleto && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h2 className="text-sm font-semibold text-zinc-900">Primeiros passos</h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {passosOnboarding.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className={"flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold " + (p.feito ? "bg-blue-600 text-white" : "border border-zinc-300 text-transparent")}>✓</span>
                  {p.feito ? (
                    <span className="text-zinc-400 line-through">{p.texto}</span>
                  ) : (
                    <Link href={p.href} className="text-blue-700 hover:underline">{p.texto}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-zinc-100 p-4">
            <div className="text-xs font-medium text-zinc-500">Competências no prazo</div>
            <div className="mt-1 text-3xl font-semibold text-zinc-900">{pctCompetenciasFechadas != null ? `${pctCompetenciasFechadas}%` : "—"}</div>
            <p className="mt-0.5 text-xs text-zinc-500">{competenciasFechadas} de {totalCompetencias} competências</p>
          </div>
          <div className="rounded-xl bg-zinc-100 p-4">
            <div className="text-xs font-medium text-zinc-500">Ações críticas</div>
            <div className="mt-1 text-3xl font-semibold text-zinc-900">{tarefasCriticasPendentes}</div>
            <p className="mt-0.5 text-xs text-orange-600">{tarefasCriticasPendentes > 0 ? `${tarefasCriticasPendentes} sem concluir` : "nenhuma pendente"}</p>
          </div>
          <div className="rounded-xl bg-zinc-100 p-4">
            <div className="text-xs font-medium text-zinc-500">Documentos recebidos</div>
            <div className="mt-1 text-3xl font-semibold text-zinc-900">{pctDocumentosRecebidos != null ? `${pctDocumentosRecebidos}%` : "—"}</div>
            <p className="mt-0.5 text-xs text-zinc-500">{documentosRecebidos} de {totalDocumentos} documentos</p>
          </div>
          <div className="rounded-xl bg-zinc-100 p-4">
            <div className="text-xs font-medium text-zinc-500">Fechamentos concluídos</div>
            <div className="mt-1 text-3xl font-semibold text-zinc-900">{competenciasFechadas}</div>
            <p className="mt-0.5 text-xs text-zinc-500">{totalCompetencias - competenciasFechadas} em andamento</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="flex flex-col gap-6">
            {/* Operação por setor */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">Operação por setor</h2>
                <Link href="/empresas" className="text-xs text-zinc-500 hover:underline">Abrir operação</Link>
              </div>
              <div className="flex flex-col gap-4">
                {porSetor.map((s) => (
                  <div key={s.setor}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-900">{setorLabel[s.setor]}</span>
                      <span className="text-zinc-500">{s.pct != null ? `${s.pct}% concluído` : "sem tarefas"}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div className={"h-full rounded-full " + setorCor[s.setor]} style={{ width: `${s.pct ?? 0}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {s.total - s.concluidas} pendente(s) · {s.criticasPendentes} crítica(s) sem concluir
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prioridades */}
            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-zinc-900">Prioridades que exigem decisão</h2>
                <Link href="/empresas" className="text-xs text-zinc-500 hover:underline">Central de pendências</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-zinc-400">
                      <th className="px-4 py-2 font-medium">Empresa</th>
                      <th className="px-4 py-2 font-medium">Ocorrência</th>
                      <th className="px-4 py-2 font-medium">Competência</th>
                      <th className="px-4 py-2 font-medium">Responsável</th>
                      <th className="px-4 py-2 font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prioridades.map((p) => (
                      <tr key={p.id} className="border-t border-zinc-100">
                        <td className="px-4 py-2.5 font-medium text-zinc-900">{p.empresa}</td>
                        <td className="px-4 py-2.5">
                          <span className={"mr-1.5 rounded-full px-2 py-0.5 text-xs font-semibold " + (severidadeStyle[p.severidade] ?? severidadeStyle.baixa)}>
                            {p.severidade === "alta" ? "Crítica" : p.severidade}
                          </span>
                          <span className="text-zinc-600">{p.ocorrencia}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">{p.referencia ?? "—"}</td>
                        <td className="px-4 py-2.5 text-zinc-600">{p.responsavel ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          {p.empresaId ? (
                            <Link href={`/empresas/${p.empresaId}`} className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                              Analisar
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                    {prioridades.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">Nenhuma prioridade em aberto na carteira.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Ações rápidas */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900">Ações rápidas</h2>
              <div className="flex flex-col gap-1.5">
                {acoesRapidas.map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-2.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 text-sm">{a.icone}</span>
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Saúde da carteira */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900">Saúde da carteira</h2>
              <ul className="flex flex-col gap-2.5 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-zinc-600">Honorário a revisar</span>
                  <span className="font-semibold text-zinc-900">{codigosAbertos.get("honorario_nao_definido") ?? 0}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-zinc-600">Risco de atraso recorrente</span>
                  <span className="font-semibold text-zinc-900">{codigosAbertos.get("competencia_atrasada") ?? 0}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-zinc-600">Certificado a vencer</span>
                  <span className="font-semibold text-zinc-900">{codigosAbertos.get("certificado_vencido_ou_vencendo") ?? 0}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-zinc-600">Impacto CBS/IBS</span>
                  <Link href="/reforma-tributaria" className="font-semibold text-blue-700 hover:underline">{totalEmpresas ?? 0}</Link>
                </li>
              </ul>
            </div>

            {/* Plano */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Plano</span>
              <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                {plano.nome}
                {plano.precoMensal != null && (
                  <span className="ml-1 font-normal text-zinc-500">
                    · {plano.precoMensal === 0 ? "grátis" : plano.precoMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "/mês"}
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {totalEmpresas ?? 0} {plano.limiteEmpresas != null ? `de ${plano.limiteEmpresas}` : ""} empresas
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
