import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RentabilidadePage() {
  const supabase = await createClient();

  const { data: empresas } = await supabase
    .from("empresas")
    .select("id, razao_social, honorario_mensal")
    .order("razao_social");

  const { data: competenciasFechadas } = await supabase
    .from("competencias")
    .select("id, empresa_id, referencia, fechada_em")
    .eq("status", "fechada");

  const { data: tarefas } = await supabase.from("tarefas").select("competencia_id, criado_em");

  const primeiraCriacaoPorCompetencia = new Map<string, string>();
  (tarefas ?? []).forEach((t) => {
    const atual = primeiraCriacaoPorCompetencia.get(t.competencia_id);
    if (!atual || t.criado_em < atual) primeiraCriacaoPorCompetencia.set(t.competencia_id, t.criado_em);
  });

  const porEmpresa = new Map<
    string,
    { fechadas: number; somaDias: number; comTempoMedido: number }
  >();
  (competenciasFechadas ?? []).forEach((c) => {
    const atual = porEmpresa.get(c.empresa_id) ?? { fechadas: 0, somaDias: 0, comTempoMedido: 0 };
    atual.fechadas += 1;
    const inicio = primeiraCriacaoPorCompetencia.get(c.id);
    if (inicio && c.fechada_em) {
      const dias = (new Date(c.fechada_em).getTime() - new Date(inicio).getTime()) / 86400000;
      if (dias >= 0) {
        atual.somaDias += dias;
        atual.comTempoMedido += 1;
      }
    }
    porEmpresa.set(c.empresa_id, atual);
  });

  const honorarioTotal = (empresas ?? []).reduce((soma, e) => soma + (e.honorario_mensal ?? 0), 0);
  const semHonorario = (empresas ?? []).filter((e) => e.honorario_mensal == null).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Órbita</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Rentabilidade e carga de trabalho
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Sem custo por hora cadastrado ainda, não dá pra calcular margem real — isso aqui mostra honorário e tempo de entrega, que já são um primeiro sinal.
          </p>
        </div>
        <Link
          href="/empresas"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Empresas
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Honorário mensal total
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">
            {honorarioTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Empresas sem honorário definido
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{semHonorario}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-2.5 font-semibold">Empresa</th>
              <th className="px-4 py-2.5 font-semibold">Honorário mensal</th>
              <th className="px-4 py-2.5 font-semibold">Competências fechadas</th>
              <th className="px-4 py-2.5 font-semibold">Tempo médio de fechamento</th>
            </tr>
          </thead>
          <tbody>
            {empresas && empresas.length > 0 ? (
              empresas.map((e) => {
                const dados = porEmpresa.get(e.id);
                const tempoMedio =
                  dados && dados.comTempoMedido > 0 ? dados.somaDias / dados.comTempoMedido : null;
                return (
                  <tr key={e.id} className="border-b border-zinc-100 last:border-none">
                    <td className="px-4 py-2.5 font-medium text-zinc-900">
                      <Link href={`/empresas/${e.id}`} className="hover:underline">
                        {e.razao_social}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">
                      {e.honorario_mensal != null
                        ? e.honorario_mensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : <span className="text-zinc-400">não definido</span>}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">{dados?.fechadas ?? 0}</td>
                    <td className="px-4 py-2.5 text-zinc-600">
                      {tempoMedio != null ? (
                        `${tempoMedio.toFixed(1)} dia(s)`
                      ) : (
                        <span className="text-zinc-400">sem dado ainda</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">
                  Nenhuma empresa cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
