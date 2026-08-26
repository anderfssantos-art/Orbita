"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { enviarDocumentosAvulsos } from "@/app/actions/caixa-entrada";

export function UploadEmLote({ empresaId }: { empresaId: string }) {
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function enviar(files: FileList | File[]) {
    const lista = Array.from(files);
    if (lista.length === 0) return;
    setMensagem(null);

    const formData = new FormData();
    formData.set("empresaId", empresaId);
    lista.forEach((file) => formData.append("files", file));

    startTransition(async () => {
      const r = await enviarDocumentosAvulsos(formData);
      if (r?.erro) setMensagem({ tipo: "erro", texto: r.erro });
      else setMensagem({ tipo: "sucesso", texto: `${r.quantidade} arquivo(s) enviado(s) para a caixa de entrada.` });
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files.length > 0) enviar(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={handleDrop}
        className={
          "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors " +
          (arrastando ? "border-emerald-500 bg-emerald-50" : "border-zinc-300 bg-zinc-50")
        }
      >
        <p className="text-zinc-600">
          Arraste vários arquivos aqui, ou{" "}
          <label className="cursor-pointer font-semibold text-emerald-700 hover:underline">
            escolha do computador
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              disabled={pending}
              onChange={(e) => e.target.files && enviar(e.target.files)}
            />
          </label>
        </p>
        {pending && <p className="text-xs text-zinc-500">Enviando...</p>}
      </div>
      {mensagem && (
        <p className={"text-xs " + (mensagem.tipo === "erro" ? "text-red-600" : "text-emerald-700")}>
          {mensagem.texto}
        </p>
      )}
    </div>
  );
}
