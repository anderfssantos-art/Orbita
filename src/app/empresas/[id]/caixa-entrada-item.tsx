"use client";

import { useState, useTransition } from "react";
import { vincularDocumentoAvulso, descartarDocumentoAvulso } from "@/app/actions/caixa-entrada";

export function CaixaEntradaItem({
  itemId,
  empresaId,
  nomeArquivo,
  documentosPendentes,
}: {
  itemId: string;
  empresaId: string;
  nomeArquivo: string;
  documentosPendentes: { id: string; tipo: string }[];
}) {
  const [documentoId, setDocumentoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function vincular() {
    if (!documentoId) return;
    setErro(null);
    const formData = new FormData();
    formData.set("itemId", itemId);
    formData.set("documentoId", documentoId);
    formData.set("empresaId", empresaId);
    startTransition(async () => {
      const r = await vincularDocumentoAvulso(formData);
      if (r?.erro) setErro(r.erro);
    });
  }

  function descartar() {
    setErro(null);
    const formData = new FormData();
    formData.set("itemId", itemId);
    formData.set("empresaId", empresaId);
    startTransition(async () => {
      const r = await descartarDocumentoAvulso(formData);
      if (r?.erro) setErro(r.erro);
    });
  }

  return (
    <li className="flex flex-col gap-1.5 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-zinc-800">{nomeArquivo}</span>
        <div className="flex flex-shrink-0 items-center gap-2">
          <select
            value={documentoId}
            onChange={(e) => setDocumentoId(e.target.value)}
            disabled={pending || documentosPendentes.length === 0}
            className="rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-emerald-600"
          >
            <option value="">vincular a...</option>
            {documentosPendentes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.tipo}
              </option>
            ))}
          </select>
          <button
            onClick={vincular}
            disabled={pending || !documentoId}
            className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-40"
          >
            vincular
          </button>
          <button
            onClick={descartar}
            disabled={pending}
            className="text-xs text-red-600 hover:underline disabled:opacity-40"
          >
            descartar
          </button>
        </div>
      </div>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </li>
  );
}
