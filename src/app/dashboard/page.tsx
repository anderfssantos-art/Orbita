import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalEmpresas },
    { count: competenciasAbertas },
    { data: pendenciasAbertas },
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
  ]);

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
            href="/reforma-tributaria"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Reforma Tributária
          </Link>
          <Link
            href="/empresas"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Empresas
          </Link>
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
