"use client";

import { useRef, useState, useTransition } from "react";
import { importarCarteira } from "@/app/actions/importacao";

export function ImportarCarteira() {
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState<string | null>(null);
  const [detalhes, setDetalhes] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [aberto, setAberto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setResumo(null);
    setDetalhes([]);

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await importarCarteira(formData);
      if (result?.erro) setErro(result.erro);
      if (result?.resumo) setResumo(result.resumo);
      if (result?.detalhes) setDetalhes(result.detalhes);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <button
        onClick={() => setAberto((a) => !a)}
        className="text-sm font-semibold text-emerald-700"
      >
        {aberto ? "Ocultar importação por planilha" : "Importar carteira por planilha (CSV)"}
      </button>

      {aberto && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-zinc-500">
            Colunas: <span className="font-mono">cnpj, razão social, regime tributário</span>. Regimes aceitos: Simples Nacional, Lucro Presumido, Lucro Real.
          </p>
          <label className="w-fit cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            {pending ? "Importando..." : "Escolher arquivo .csv"}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={pending}
              onChange={handleFileChange}
            />
          </label>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {resumo && <p className="text-sm text-emerald-700">{resumo}</p>}
          {detalhes.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-amber-700">
              {detalhes.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
