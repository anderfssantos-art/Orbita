"use client";

import { useState, useTransition } from "react";
import { gerarConvite } from "@/app/actions/convites";

export function GerarConviteButton({ empresaId }: { empresaId: string }) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setErro(null);
    setCodigo(null);
    const formData = new FormData();
    formData.set("empresaId", empresaId);
    startTransition(async () => {
      const result = await gerarConvite(formData);
      if (result?.erro) setErro(result.erro);
      if (result?.codigo) setCodigo(result.codigo);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={pending}
        className="self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        {pending ? "Gerando..." : "Gerar convite"}
      </button>
      {codigo && (
        <p className="text-sm text-zinc-700">
          Código:{" "}
          <span className="rounded bg-emerald-100 px-2 py-1 font-mono font-semibold text-emerald-700">
            {codigo}
          </span>{" "}
          — envie ao cliente junto com o link{" "}
          <span className="font-mono text-xs">/portal/cadastro</span>. Válido para um único uso.
        </p>
      )}
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}
