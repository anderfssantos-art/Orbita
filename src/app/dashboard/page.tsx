import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { planoDe } from "@/lib/planos";

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
      .select("id, titulo, severidade, competencias(referencia, empresas(id, razao_social))")
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

  const totalDocumentos = documentos?.length ?? 0;
  const documentosRecebidos = (documentos ?? []).filter((d) => d.status === "recebido").length;
  const pctDocumentosRecebidos = totalDocumentos > 0 ? Math.round((documentosRecebidos / totalDocumentos) * 100) : null;

  const tarefasCriticasPendentes = (tarefas ?? []).filter((t) => t.critica && t.status !== "concluida").length;

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
        titulo: a.titulo,
        severidade: a.severidade,
      };
    }),
    ...(pendenciasAbertas ?? []).map((p) => {
      const c = p.competencias as unknown as { referencia: string; empresas: { id: string; razao_social: string } } | null;
      return {
        id: p.id,
        empresa: c?.empresas?.razao_social ?? "—",
        empresaId: c?.empresas?.id,
        titulo: p.titulo,
        severidade: p.severidade,
      };
    }),
  ]
    .sort((a, b) => (a.severidade === "alta" ? -1 : b.severidade === "alta" ? 1 : 0))
    .slice(0, 8);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 font-mono text-sm font-bold text-white">
            Ω
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">{escritorio?.nome ?? "Órbita"}</h1>
            <p className="text-xs text-zinc-500">Visão executiva · {new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" })}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/ajuda" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Ajuda</Link>
          <Link href="/eventos" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Trilha de auditoria</Link>
          <Link href="/empresas" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Empresas</Link>
        </div>
      </div>

      {!onboardingCompleto && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Primeiros passos</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {passosOnboarding.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className={"flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold " + (p.feito ? "bg-emerald-600 text-white" : "border border-zinc-300 text-transparent")}>✓</span>
                {p.feito ? (
                  <span className="text-zinc-400 line-through">{p.texto}</span>
                ) : (
                  <Link href={p.href} className="text-emerald-800 hover:underline">{p.texto}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Competências fechadas</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">
            {competenciasFechadas}
            <span className="text-base font-normal text-zinc-400"> / {totalCompetencias}</span>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tarefas críticas pendentes</div>
          <div className={"mt-1 text-2xl font-semibold " + (tarefasCriticasPendentes > 0 ? "text-amber-600" : "text-zinc-900")}>
            {tarefasCriticasPendentes}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Documentos recebidos</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{pctDocumentosRecebidos != null ? `${pctDocumentosRecebidos}%` : "—"}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Alertas de auditoria</div>
          <div className={"mt-1 text-2xl font-semibold " + ((alertasAbertos?.length ?? 0) > 0 ? "text-red-600" : "text-zinc-900")}>
            {alertasAbertos?.length ?? 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {/* Operação por setor */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Operação por setor</h2>
              <Link href="/empresas" className="text-xs text-emerald-700 hover:underline">Abrir operação</Link>
            </div>
            <div className="flex flex-col gap-4">
              {porSetor.map((s) => (
                <div key={s.setor}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-900">{setorLabel[s.setor]}</span>
                    <span className="text-zinc-500">{s.pct != null ? `${s.pct}% concluído` : "sem tarefas"}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={"h-full rounded-full " + (s.criticasPendentes > 0 ? "bg-amber-500" : "bg-emerald-600")}
                      style={{ width: `${s.pct ?? 0}%` }}
                    />
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
              <span className="text-xs text-zinc-500">{prioridades.length} no total</span>
            </div>
            <ul className="divide-y divide-zinc-100">
              {prioridades.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={"flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold " + (severidadeStyle[p.severidade] ?? severidadeStyle.baixa)}>
                      {p.severidade}
                    </span>
                    <span className="truncate">
                      <span className="font-medium text-zinc-900">{p.empresa}</span>
                      <span className="ml-1.5 text-zinc-500">{p.titulo}</span>
                    </span>
                  </div>
                  {p.empresaId && (
                    <Link href={`/empresas/${p.empresaId}`} className="flex-shrink-0 text-xs font-semibold text-emerald-700 hover:underline">
                      analisar
                    </Link>
                  )}
                </li>
              ))}
              {prioridades.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-zinc-500">Nenhuma prioridade em aberto na carteira.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Ações rápidas */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">Ações rápidas</h2>
            <div className="flex flex-col gap-1.5">
              <Link href="/empresas" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">Abrir empresa</Link>
              <Link href="/servicos" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">Catálogo de serviços</Link>
              <Link href="/rentabilidade" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">Rentabilidade</Link>
              <Link href="/reforma-tributaria" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">Reforma Tributária</Link>
            </div>
          </div>

          {/* Saúde da carteira */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">Saúde da carteira</h2>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-zinc-600">Honorário a revisar</span>
                <span className="font-semibold text-zinc-900">{codigosAbertos.get("honorario_nao_definido") ?? 0}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-zinc-600">Risco de atraso</span>
                <span className="font-semibold text-zinc-900">{codigosAbertos.get("competencia_atrasada") ?? 0}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-zinc-600">Certificado a vencer</span>
                <span className="font-semibold text-zinc-900">{codigosAbertos.get("certificado_vencido_ou_vencendo") ?? 0}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-zinc-600">Empresas no radar CBS/IBS</span>
                <Link href="/reforma-tributaria" className="font-semibold text-emerald-700 hover:underline">{totalEmpresas ?? 0}</Link>
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
    </main>
  );
}
