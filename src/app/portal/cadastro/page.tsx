"use client";

import { useState, useTransition } from "react";
import { cadastrarClientePortal } from "@/app/actions/portal";

export default function PortalCadastroPage() {
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const result = await cadastrarClientePortal(formData);
      if (result?.erro) setErro(result.erro);
      if (result?.sucesso) setSucesso(result.sucesso);
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Portal do cliente
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Criar acesso
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Use o código de convite que seu escritório de contabilidade te enviou.
        </p>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Código do convite
          <input
            name="codigo"
            required
            placeholder="Ex: A7X92KLM"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase outline-none focus:border-emerald-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Seu nome
          <input
            name="nome"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          E-mail
          <input
            name="email"
            type="email"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Senha
          <input
            name="senha"
            type="password"
            required
            minLength={6}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
        </label>

        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {sucesso && <p className="text-sm text-emerald-700">{sucesso}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Criando..." : "Criar acesso"}
        </button>
      </form>
    </main>
  );
}
