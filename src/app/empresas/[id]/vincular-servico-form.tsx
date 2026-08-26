"use client";

import { useState, useTransition } from "react";
import { vincularServico } from "@/app/actions/servicos";

type Servico = { id: string; nome: string; setor: string };

export function VincularServicoForm({
  empresaId,
  servicosDisponiveis,
}: {
  empresaId: string;
  servicosDisponiveis: Servico[];
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const result = await vincularServico(formData);
      if (result?.erro) setErro(result.erro);
    });
  }

  if (servicosDisponiveis.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todos os serviços do catálogo já estão contratados por esta empresa.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex items-end gap-3">
      <input type="hidden" name="empresaId" value={empresaId} />
      <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700">
        Contratar serviço
        <select
          name="servicoId"
          required
          defaultValue=""
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        >
          <option value="" disabled>Selecione</option>
          {servicosDisponiveis.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
      >
        {pending ? "Vinculando..." : "Vincular"}
      </button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </form>
  );
}
