"use client";

import { useState, useTransition } from "react";
import { definirHonorario } from "@/app/actions/empresas";

export function HonorarioInput({
  empresaId,
  valorAtual,
}: {
  empresaId: string;
  valorAtual: number | null;
}) {
  const [valor, setValor] = useState(valorAtual?.toString() ?? "");
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function salvar() {
    setErro(null);
    setSalvo(false);
    const formData = new FormData();
    formData.set("empresaId", empresaId);
    formData.set("honorarioMensal", valor);
    startTransition(async () => {
      const r = await definirHonorario(formData);
      if (r?.erro) setErro(r.erro);
      else setSalvo(true);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-1.5 text-sm text-zinc-700">
        Honorário mensal (R$)
        <input
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setSalvo(false);
          }}
          placeholder="0,00"
          className="w-28 rounded-lg border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-emerald-600"
        />
      </label>
      <button
        onClick={salvar}
        disabled={pending}
        className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "salvar"}
      </button>
      {salvo && <span className="text-xs text-emerald-700">salvo</span>}
      {erro && <span className="text-xs text-red-600">{erro}</span>}
    </div>
  );
}
