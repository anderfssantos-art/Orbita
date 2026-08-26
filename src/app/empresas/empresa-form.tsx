"use client";

import { useRef, useState, useTransition } from "react";
import { criarEmpresa } from "@/app/actions/empresas";

export function EmpresaForm() {
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const result = await criarEmpresa(formData);
      if (result?.erro) {
        setErro(result.erro);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        CNPJ
        <input
          name="cnpj"
          required
          placeholder="00.000.000/0001-00"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
      </label>
      <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-sm text-zinc-700">
        Razão social
        <input
          name="razaoSocial"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Regime tributário
        <select
          name="regimeTributario"
          required
          defaultValue=""
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        >
          <option value="" disabled>
            Selecione
          </option>
          <option value="Simples Nacional">Simples Nacional</option>
          <option value="Lucro Presumido">Lucro Presumido</option>
          <option value="Lucro Real">Lucro Real</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar empresa"}
      </button>

      {erro && <p className="w-full text-sm text-red-600">{erro}</p>}
    </form>
  );
}
