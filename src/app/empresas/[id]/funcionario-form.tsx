"use client";

import { useRef, useState, useTransition } from "react";
import { criarFuncionario } from "@/app/actions/dp";

export function FuncionarioForm({ empresaId }: { empresaId: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await criarFuncionario(formData);
      if (r?.erro) setErro(r.erro);
      else formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
    >
      <input type="hidden" name="empresaId" value={empresaId} />
      <label className="flex flex-1 min-w-[160px] flex-col gap-1 text-xs text-zinc-700">
        Nome
        <input name="nome" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-600" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-700">
        CPF
        <input name="cpf" required placeholder="00000000000" className="w-32 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-600" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-700">
        Admissão
        <input name="dataAdmissao" type="date" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-600" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar"}
      </button>
      {erro && <p className="w-full text-xs text-red-600">{erro}</p>}
    </form>
  );
}
