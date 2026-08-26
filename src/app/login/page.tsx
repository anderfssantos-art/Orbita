"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { entrar } from "@/app/actions/auth";

export default function LoginPage() {
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const result = await entrar(formData);
      if (result?.erro) setErro(result.erro);
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Órbita
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Entrar
        </h1>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
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
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
        </label>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-zinc-600">
        Ainda não tem um escritório cadastrado?{" "}
        <Link href="/cadastro" className="font-semibold text-emerald-700">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
