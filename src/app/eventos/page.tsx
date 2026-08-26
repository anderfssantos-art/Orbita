import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const acaoStyle: Record<string, string> = {
  criado: "bg-emerald-100 text-emerald-700",
  atualizado: "bg-amber-100 text-amber-700",
  excluido: "bg-red-100 text-red-700",
};

export default async function EventosPage() {
  const supabase = await createClient();

  const { data: eventos } = await supabase
    .from("eventos")
    .select("id, entidade, acao, criado_em, usuarios(nome)")
    .order("criado_em", { ascending: false })
    .limit(200);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Órbita</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Trilha de auditoria</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Últimos 200 eventos — quem criou, atualizou ou excluiu o quê, e quando. Gravado automaticamente pelo banco, não pela aplicação.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Painel
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-2.5 font-semibold">Quando</th>
              <th className="px-4 py-2.5 font-semibold">Quem</th>
              <th className="px-4 py-2.5 font-semibold">Ação</th>
              <th className="px-4 py-2.5 font-semibold">Entidade</th>
            </tr>
          </thead>
          <tbody>
            {eventos && eventos.length > 0 ? (
              eventos.map((e) => {
                const usuario = e.usuarios as unknown as { nome: string } | null;
                return (
                  <tr key={e.id} className="border-b border-zinc-100 last:border-none">
                    <td className="px-4 py-2 font-mono text-xs text-zinc-500">
                      {new Date(e.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </td>
                    <td className="px-4 py-2 text-zinc-700">{usuario?.nome ?? "cliente do portal"}</td>
                    <td className="px-4 py-2">
                      <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (acaoStyle[e.acao] ?? "bg-zinc-100 text-zinc-600")}>
                        {e.acao}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-600">{e.entidade}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">
                  Nenhum evento registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
