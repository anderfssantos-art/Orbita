import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { marcosReforma, marcoAtual, proximoMarco, notaImpactoPorRegime } from "@/lib/radar-reforma";

export default async function ReformaTributariaPage() {
  const supabase = await createClient();
  const { data: empresas } = await supabase
    .from("empresas")
    .select("id, razao_social, regime_tributario")
    .order("razao_social");

  const hoje = new Date();
  const atual = marcoAtual(hoje);
  const proximo = proximoMarco(hoje);

  const porRegime = new Map<string, { id: string; razao_social: string }[]>();
  (empresas ?? []).forEach((e) => {
    const lista = porRegime.get(e.regime_tributario) ?? [];
    lista.push({ id: e.id, razao_social: e.razao_social });
    porRegime.set(e.regime_tributario, lista);
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Órbita</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Radar da Reforma Tributária
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Calendário oficial de transição do CBS/IBS e quem da sua carteira é afetado em cada fase.
          </p>
        </div>
        <Link
          href="/empresas"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Empresas
        </Link>
      </div>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Fase atual</p>
        <p className="mt-1 text-lg font-semibold text-zinc-900">{atual.titulo}</p>
        <p className="mt-1 text-sm text-zinc-700">{atual.descricao}</p>
        {proximo && (
          <p className="mt-2 text-xs text-emerald-800">
            Próxima fase: {proximo.titulo} — a partir de{" "}
            {new Date(proximo.inicio).toLocaleDateString("pt-BR", { timeZone: "UTC" })}.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Linha do tempo</h2>
        <ol className="flex flex-col gap-2">
          {marcosReforma.map((m) => {
            const isAtual = m.codigo === atual.codigo;
            return (
              <li
                key={m.codigo}
                className={
                  "rounded-lg border p-3 text-sm " +
                  (isAtual ? "border-emerald-400 bg-emerald-50" : "border-zinc-200 bg-white")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-900">{m.titulo}</span>
                  {isAtual && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                      agora
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-600">{m.descricao}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-400">Fonte: {m.fonte}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Mapa de clientes afetados</h2>
        {porRegime.size === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma empresa cadastrada ainda.</p>
        ) : (
          [...porRegime.entries()].map(([regime, lista]) => (
            <div key={regime} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">{regime}</h3>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                  {lista.length} empresa(s)
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-600">{notaImpactoPorRegime(regime)}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {lista.map((e) => (
                  <li key={e.id}>
                    <Link href={`/empresas/${e.id}`} className="text-xs text-emerald-700 hover:underline">
                      {e.razao_social}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
