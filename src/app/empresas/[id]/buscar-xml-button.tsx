"use client";

import { useState, useTransition } from "react";
import { buscarXmlDaEmpresa } from "@/app/actions/busca-xml";

export function BuscarXmlButton({
  empresaId,
  certificadoId,
}: {
  empresaId: string;
  certificadoId: string;
}) {
  const [cUF, setCUF] = useState("");
  const [resultado, setResultado] = useState<{
    sucesso?: boolean;
    erro?: string;
    respostaBruta?: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setResultado(null);
    const formData = new FormData();
    formData.set("empresaId", empresaId);
    formData.set("certificadoId", certificadoId);
    formData.set("cUF", cUF);
    startTransition(async () => {
      const r = await buscarXmlDaEmpresa(formData);
      setResultado(r);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-800">
        ⚠ Experimental — nunca testado contra a Receita de verdade. Só busca em ambiente de homologação (sem efeito fiscal real).
      </p>
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-700">
          UF (código IBGE, ex: 35 = SP)
          <input
            value={cUF}
            onChange={(e) => setCUF(e.target.value)}
            maxLength={2}
            placeholder="35"
            className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-600"
          />
        </label>
        <button
          onClick={handleClick}
          disabled={pending || cUF.length !== 2}
          className="rounded-lg border border-zinc-400 px-3 py-1.5 text-xs font-semibold text-zinc-700 disabled:opacity-50"
        >
          {pending ? "Buscando..." : "Buscar XML (homologação)"}
        </button>
      </div>
      {resultado && (
        <div className="text-xs">
          {resultado.erro && <p className="text-red-600">Erro: {resultado.erro}</p>}
          {resultado.respostaBruta && (
            <details className="mt-1">
              <summary className="cursor-pointer text-zinc-600">Ver resposta bruta da Receita</summary>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[10px] text-zinc-700">
                {resultado.respostaBruta}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
