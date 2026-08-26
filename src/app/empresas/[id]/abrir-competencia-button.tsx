"use client";

import { useState, useTransition } from "react";
import { abrirCompetencia } from "@/app/actions/competencias";

export function AbrirCompetenciaButton({ empresaId }: { empresaId: string }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setErro(null);
    setMensagem(null);
    const formData = new FormData();
    formData.set("empresaId", empresaId);
    startTransition(async () => {
      const result = await abrirCompetencia(formData);
      if (result?.erro) setErro(result.erro);
      if (result?.aviso) setMensagem(result.aviso);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={pending}
        className="self-start rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Abrindo..." : "Abrir competência do mês"}
      </button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {mensagem && <p className="text-sm text-amber-700">{mensagem}</p>}
    </div>
  );
}
