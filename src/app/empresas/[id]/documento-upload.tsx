"use client";

import { useRef, useState, useTransition } from "react";
import { enviarDocumento } from "@/app/actions/documentos";

export function DocumentoUpload({
  documentoId,
  competenciaId,
  empresaId,
  tipo,
}: {
  documentoId: string;
  competenciaId: string;
  empresaId: string;
  tipo: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);

    const formData = new FormData();
    formData.set("documentoId", documentoId);
    formData.set("competenciaId", competenciaId);
    formData.set("empresaId", empresaId);
    formData.set("tipo", tipo);
    formData.set("file", file);

    startTransition(async () => {
      const result = await enviarDocumento(formData);
      if (result?.erro) setErro(result.erro);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="cursor-pointer rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200">
        {pending ? "Enviando..." : "enviar arquivo"}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={pending}
          onChange={handleFileChange}
        />
      </label>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
