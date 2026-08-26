import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ServicoForm } from "./servico-form";
import { RevisaoToggle } from "./revisao-toggle";

const setorLabel: Record<string, string> = {
  fiscal: "Fiscal",
  contabil: "Contábil",
  dp: "Departamento Pessoal",
};

export default async function ServicosPage() {
  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("id, nome, setor, critica, exige_revisao_4_olhos, documentos_necessarios")
    .order("nome");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Órbita
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Catálogo de serviços
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Cada serviço vira uma tarefa automática quando você abre a competência de uma empresa que o contratou.
          </p>
        </div>
        <Link
          href="/empresas"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Empresas
        </Link>
      </div>

      <ServicoForm />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-2.5 font-semibold">Nome</th>
              <th className="px-4 py-2.5 font-semibold">Setor</th>
              <th className="px-4 py-2.5 font-semibold">Documentos</th>
              <th className="px-4 py-2.5 font-semibold">Crítico</th>
              <th className="px-4 py-2.5 font-semibold">Revisão 4 olhos</th>
            </tr>
          </thead>
          <tbody>
            {servicos && servicos.length > 0 ? (
              servicos.map((servico) => (
                <tr key={servico.id} className="border-b border-zinc-100 last:border-none">
                  <td className="px-4 py-2.5 font-medium text-zinc-900">{servico.nome}</td>
                  <td className="px-4 py-2.5 text-zinc-600">{setorLabel[servico.setor] ?? servico.setor}</td>
                  <td className="px-4 py-2.5 text-zinc-600">
                    {servico.documentos_necessarios?.length
                      ? servico.documentos_necessarios.join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {servico.critica ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Sim
                      </span>
                    ) : (
                      <span className="text-zinc-400">Não</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <RevisaoToggle servicoId={servico.id} ativo={servico.exige_revisao_4_olhos} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                  Nenhum serviço cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
