import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { planoDe } from "@/lib/planos";

export default async function DashboardPage() {
  const supabase = await createClient();
  const usuario = await usuarioAtual(supabase);

  const { data: escritorio } = usuario
    ? await supabase.from("escritorios").select("plano").eq("id", usuario.escritorio_id).maybeSingle()
    : { data: null };
  const plano = planoDe(escritorio?.plano ?? "trial");

  const [
    { count: totalEmpresas },
    { count: competenciasAbertas },
    { data: pendenciasAbertas },
    { count: totalServicos },
    { count: totalServicosVinculados },
    { count: totalCompetencias },
    { count: totalClientesConvidados },
  ] = await Promise.all([
    supabase.from("empresas").select("id", { count: "exact", head: true }),
    supabase
      .from("competencias")
      .select("id", { count: "exact", head: true })
      .eq("status", "aberta"),
    supabase
      .from("pendencias")
      .select("id, titulo, severidade, competencias(referencia, empresas(razao_social))")
      .eq("status", "aberta")
      .order("severidade"),
    supabase.from("servicos").select("id", { count: "exact", head: true }),
    supabase.from("empresa_servicos").select("empresa_id", { count: "exact", head: true }),
    supabase.from("competencias").select("id", { count: "exact", head: true }),
    supabase.from("acessos_cliente").select("id", { count: "exact", head: true }),
  ]);

  const passosOnboarding = [
    { feito: (totalEmpresas ?? 0) > 0, texto: "Cadastre a primeira empresa", href: "/empresas" },
    { feito: (totalServicos ?? 0) > 0, texto: "Adicione um serviço ao catálogo", href: "/servicos" },
    {
      feito: (totalServicosVinculados ?? 0) > 0,
      texto: "Contrate um serviço para uma empresa",
      href: "/empresas",
    },
    { feito: (totalCompetencias ?? 0) > 0, texto: "Abra a primeira competência", href: "/empresas" },
    {
      feito: (totalClientesConvidados ?? 0) > 0,
      texto: "Convide um cliente para o portal",
      href: "/empresas",
    },
  ];
  const onboardingCompleto = passosOnboarding.every((p) => p.feito);

  const porSeveridade = { alta: 0, media: 0, baixa: 0 } as Record<string, number>;
  (pendenciasAbertas ?? []).forEach((p) => {
    porSeveridade[p.severidade] = (porSeveridade[p.severidade] ?? 0) + 1;
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Órbita</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Painel do escritório
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/ajuda"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Ajuda
          </Link>
          <Link
            href="/reforma-tributaria"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Reforma Tributária
          </Link>
          <Link
            href="/rentabilidade"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Rentabilidade
          </Link>
          <Link
            href="/eventos"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Trilha de auditoria
          </Link>
          <Link
            href="/empresas"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Empresas
          </Link>
        </div>
      </div>

      {!onboardingCompleto && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Primeiros passos</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {passosOnboarding.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold " +
                    (p.feito ? "bg-emerald-600 text-white" : "border border-zinc-300 text-transparent")
                  }
                >
                  ✓
                </span>
                {p.feito ? (
                  <span className="text-zinc-400 line-through">{p.texto}</span>
                ) : (
                  <Link href={p.href} className="text-emerald-800 hover:underline">
                    {p.texto}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Plano</span>
            <p className="mt-0.5 text-sm font-semibold text-zinc-900">
              {plano.nome}
              {plano.precoMensal != null && (
                <span className="ml-1 font-normal text-zinc-500">
                  ·{" "}
                  {plano.precoMensal === 0
                    ? "grátis"
                    : plano.precoMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "/mês"}
                </span>
              )}
            </p>
          </div>
          <span className="text-sm text-zinc-600">
            {totalEmpresas ?? 0} {plano.limiteEmpresas != null ? `de ${plano.limiteEmpresas}` : ""} empresas
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Empresas</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{totalEmpresas ?? 0}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Competências abertas</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{competenciasAbertas ?? 0}</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Pendências altas</div>
          <div className="mt-1 text-2xl font-semibold text-red-700">{porSeveridade.alta}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pendências médias</div>
          <div className="mt-1 text-2xl font-semibold text-amber-700">{porSeveridade.media}</div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Pendências abertas em toda a carteira ({pendenciasAbertas?.length ?? 0})
          </h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {(pendenciasAbertas ?? []).map((p) => {
            const competencia = p.competencias as unknown as {
              referencia: string;
              empresas: { razao_social: string };
            } | null;
            return (
              <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="font-medium text-zinc-900">{competencia?.empresas?.razao_social ?? "—"}</span>
                  <span className="ml-2 text-zinc-500">{p.titulo}</span>
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs font-semibold " +
                    (p.severidade === "alta"
                      ? "bg-red-100 text-red-700"
                      : p.severidade === "media"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-zinc-100 text-zinc-600")
                  }
                >
                  {p.severidade}
                </span>
              </li>
            );
          })}
          {(!pendenciasAbertas || pendenciasAbertas.length === 0) && (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              Nenhuma pendência aberta na carteira.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}
