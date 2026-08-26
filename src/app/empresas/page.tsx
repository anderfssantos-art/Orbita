import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { sair } from "@/app/actions/auth";
import { EmpresaForm } from "./empresa-form";
import { ImportarCarteira } from "./importar-carteira";

export default async function EmpresasPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { data: usuario } = authUser
    ? await supabase
        .from("usuarios")
        .select("nome, escritorios(nome)")
        .eq("id", authUser.id)
        .maybeSingle()
    : { data: null };

  const { data: empresas } = await supabase
    .from("empresas")
    .select("id, cnpj, razao_social, regime_tributario, status")
    .order("razao_social");

  const nomeEscritorio = (
    usuario?.escritorios as unknown as { nome: string } | null
  )?.nome;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {nomeEscritorio ?? "Órbita"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Empresas
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Olá, {usuario?.nome ?? "usuário"} — {empresas?.length ?? 0}{" "}
            {empresas?.length === 1 ? "empresa cadastrada" : "empresas cadastradas"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Painel
          </Link>
          <Link
            href="/servicos"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Catálogo de serviços
          </Link>
          <form action={sair}>
            <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
              Sair
            </button>
          </form>
        </div>
      </div>

      <EmpresaForm />

      <ImportarCarteira />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-2.5 font-semibold">CNPJ</th>
              <th className="px-4 py-2.5 font-semibold">Razão social</th>
              <th className="px-4 py-2.5 font-semibold">Regime</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {empresas && empresas.length > 0 ? (
              empresas.map((empresa) => (
                <tr
                  key={empresa.id}
                  className="cursor-pointer border-b border-zinc-100 last:border-none hover:bg-zinc-50"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-600">
                    <Link href={`/empresas/${empresa.id}`} className="block">
                      {empresa.cnpj}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-zinc-900">
                    <Link href={`/empresas/${empresa.id}`} className="block">
                      {empresa.razao_social}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600">
                    <Link href={`/empresas/${empresa.id}`} className="block">
                      {empresa.regime_tributario}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {empresa.status}
                    </span>
                  </td>
                </tr>
              ))
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
