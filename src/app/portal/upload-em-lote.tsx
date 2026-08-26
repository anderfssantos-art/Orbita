"use client";

import { useRef, useState, useTransition } from "react";
import { enviarDocumentosAvulsos } from "@/app/actions/caixa-entrada";

export function UploadEmLotePortal({ empresaId }: { empresaId: string }) {
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setMensagem(null);

    const formData = new FormData();
    formData.set("empresaId", empresaId);
    Array.from(files).forEach((file) => formData.append("files", file));

    startTransition(async () => {
      const r = await enviarDocumentosAvulsos(formData);
      if (r?.erro) setMensagem({ tipo: "erro", texto: r.erro });
      else setMensagem({ tipo: "sucesso", texto: `${r.quantidade} arquivo(s) enviado(s). O escritório vai conferir em breve.` });
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold text-zinc-900">Enviar documentos</h2>
      <p className="mb-3 text-sm text-zinc-600">
        Pode mandar vários arquivos de uma vez, mesmo que não estejam na lista de pendências.
      </p>
      <label className="inline-block cursor-pointer rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800">
        {pending ? "Enviando..." : "Escolher arquivos"}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          disabled={pending}
          onChange={handleChange}
        />
      </label>
      {mensagem && (
        <p className={"mt-2 text-xs " + (mensagem.tipo === "erro" ? "text-red-600" : "text-emerald-700")}>
          {mensagem.texto}
        </p>
      )}
    </div>
  );
}
