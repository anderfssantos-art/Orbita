"use client";

import { useTransition } from "react";
import { alternarRevisao4Olhos } from "@/app/actions/servicos";

export function RevisaoToggle({ servicoId, ativo }: { servicoId: string; ativo: boolean }) {
  const [pending, startTransition] = useTransition();

  function alternar() {
    const formData = new FormData();
    formData.set("servicoId", servicoId);
    formData.set("valor", (!ativo).toString());
    startTransition(() => {
      alternarRevisao4Olhos(formData);
    });
  }

  return (
    <button
      onClick={alternar}
      disabled={pending}
      title="Se desativado, uma tarefa crítica pode ser concluída sem que outra pessoa aprove — útil para quem trabalha sozinho."
      className={
        "rounded-full px-2 py-0.5 text-xs font-semibold disabled:opacity-50 " +
        (ativo ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500")
      }
    >
      {ativo ? "exigida" : "desativada"}
    </button>
  );
}
