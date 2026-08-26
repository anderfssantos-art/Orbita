"use client";

import { useTransition } from "react";
import { atribuirResponsavel } from "@/app/actions/competencias";

export function ResponsavelSelect({
  tarefaId,
  empresaId,
  responsavelAtualId,
  colaboradores,
}: {
  tarefaId: string;
  empresaId: string;
  responsavelAtualId: string | null;
  colaboradores: { id: string; nome: string }[];
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData();
    formData.set("tarefaId", tarefaId);
    formData.set("empresaId", empresaId);
    formData.set("responsavelId", e.target.value);
    startTransition(() => {
      atribuirResponsavel(formData);
    });
  }

  return (
    <select
      defaultValue={responsavelAtualId ?? ""}
      onChange={handleChange}
      disabled={pending}
      className="rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-emerald-600 disabled:opacity-50"
    >
      <option value="">sem responsável</option>
      {colaboradores.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nome}
        </option>
      ))}
    </select>
  );
}
