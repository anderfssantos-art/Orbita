"use client";

import { useRef, useState, useTransition } from "react";
import { criarServico } from "@/app/actions/servicos";

export function ServicoForm() {
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const result = await criarServico(formData);
      if (result?.erro) setErro(result.erro);
      else formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <label className="flex flex-1 min-w-[180px] flex-col gap-1 text-sm text-zinc-700">
        Nome do serviço
        <input
          name="nome"
          required
          placeholder="Ex: Apuração de impostos"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Setor
        <select
          name="setor"
          required
          defaultValue=""
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        >
          <option value="" disabled>Selecione</option>
          <option value="fiscal">Fiscal</option>
          <option value="contabil">Contábil</option>
          <option value="dp">Departamento Pessoal</option>
        </select>
      </label>
      <label className="flex flex-1 min-w-[220px] flex-col gap-1 text-sm text-zinc-700">
        Documentos necessários
        <input
          name="documentosNecessarios"
          placeholder="XML de saída, Extrato bancário (separados por vírgula)"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm text-zinc-700">
        <input type="checkbox" name="critica" className="h-4 w-4" />
        Serviço crítico
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar serviço"}
      </button>

      {erro && <p className="w-full text-sm text-red-600">{erro}</p>}
    </form>
  );
}
