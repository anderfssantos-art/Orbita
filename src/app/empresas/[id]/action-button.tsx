"use client";

import { useState, useTransition } from "react";

type ActionResult = { erro?: string; aviso?: string; sucesso?: boolean } | void;

export function ActionButton({
  action,
  fields,
  label,
  pendingLabel,
  variant = "default",
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  fields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  variant?: "default" | "primary" | "danger";
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setErro(null);
    setAviso(null);
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => formData.set(k, v));
    startTransition(async () => {
      const result = await action(formData);
      if (result?.erro) setErro(result.erro);
      if (result?.aviso) setAviso(result.aviso);
    });
  }

  const styles = {
    default: "border border-zinc-300 text-zinc-700 hover:bg-zinc-50",
    primary: "bg-emerald-700 text-white",
    danger: "border border-red-300 text-red-700 hover:bg-red-50",
  }[variant];

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className={`self-start rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${styles}`}
      >
        {pending ? pendingLabel ?? "Processando..." : label}
      </button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
      {aviso && <p className="text-xs text-amber-700">{aviso}</p>}
    </div>
  );
}
