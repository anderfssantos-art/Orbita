import { createClient } from "@/lib/supabase/server";
import { sair } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { UploadEmLotePortal } from "./upload-em-lote";

export default async function PortalPage() {
  const supabase = await createClient();

  const { data: acesso } = await supabase
    .from("acessos_cliente")
    .select("empresa_id, empresas(razao_social, cnpj)")
    .limit(1)
    .maybeSingle();

  if (!acesso) redirect("/login");

  const empresa = acesso.empresas as unknown as { razao_social: string; cnpj: string };

  const { data: competencias } = await supabase
    .from("competencias")
    .select("id, referencia, status")
    .eq("empresa_id", acesso.empresa_id)
    .order("referencia", { ascending: false })
    .limit(1);

  const competenciaAtual = competencias?.[0];

  const [{ data: documentos }, { data: pendencias }] = competenciaAtual
    ? await Promise.all([
        supabase
          .from("documentos")
          .select("id, tipo, status")
          .eq("competencia_id", competenciaAtual.id)
          .order("tipo"),
        supabase
          .from("pendencias")
          .select("id, titulo, status")
          .eq("competencia_id", competenciaAtual.id)
          .eq("status", "aberta"),
      ])
    : [{ data: [] }, { data: [] }];

  const recebidos = (documentos ?? []).filter((d) => d.status === "recebido").length;
  const total = documentos?.length ?? 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Portal do cliente
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {empresa.razao_social}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{empresa.cnpj}</p>
        </div>
        <form action={sair}>
          <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
            Sair
          </button>
        </form>
      </div>

      {competenciaAtual ? (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-600">
              Competência <span className="font-mono">{competenciaAtual.referencia}</span>
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {competenciaAtual.status === "fechada"
                ? "Mês fechado"
                : `${recebidos} de ${total} documentos recebidos`}
            </p>
          </div>

          {pendencias && pendencias.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900">
                O que ainda precisamos de você
              </h2>
              <ul className="flex flex-col gap-1.5">
                {pendencias.map((p) => (
                  <li key={p.id} className="text-sm text-zinc-700">
                    • {p.titulo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">Documentos</h2>
            <ul className="flex flex-col gap-1.5">
              {documentos?.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span>{d.tipo}</span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-semibold " +
                      (d.status === "recebido"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700")
                    }
                  >
                    {d.status === "recebido" ? "recebido" : "pendente"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Nenhuma competência aberta no momento.</p>
      )}

      <UploadEmLotePortal empresaId={acesso.empresa_id} />
    </main>
  );
}
