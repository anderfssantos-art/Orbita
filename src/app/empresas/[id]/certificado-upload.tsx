"use client";

import { useRef, useState, useTransition } from "react";
import { enviarCertificado, removerCertificado } from "@/app/actions/certificados";

type Certificado = {
  id: string;
  nome_arquivo: string;
  validade: string | null;
  criado_em: string;
};

function diasParaVencer(validade: string): number {
  const hoje = new Date();
  const venc = new Date(validade);
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export function CertificadoUpload({
  empresaId,
  certificadoAtual,
}: {
  empresaId: string;
  certificadoAtual: Certificado | null;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removendo, startRemovendo] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const result = await enviarCertificado(formData);
      if (result?.erro) setErro(result.erro);
      else formRef.current?.reset();
    });
  }

  function handleRemover() {
    if (!certificadoAtual) return;
    const formData = new FormData();
    formData.set("certificadoId", certificadoAtual.id);
    formData.set("empresaId", empresaId);
    startRemovendo(async () => {
      await removerCertificado(formData);
    });
  }

  if (certificadoAtual) {
    const dias = certificadoAtual.validade ? diasParaVencer(certificadoAtual.validade) : null;
    const vencendo = dias !== null && dias <= 30;

    return (
      <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
        <div>
          <span className="font-medium text-zinc-900">{certificadoAtual.nome_arquivo}</span>
          {certificadoAtual.validade && (
            <span
              className={
                "ml-2 rounded-full px-2 py-0.5 text-xs font-semibold " +
                (vencendo ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")
              }
            >
              {vencendo ? `vence em ${dias} dia(s)` : `válido até ${new Date(certificadoAtual.validade).toLocaleDateString("pt-BR")}`}
            </span>
          )}
        </div>
        <button
          onClick={handleRemover}
          disabled={removendo}
          className="text-xs text-red-600 hover:underline disabled:opacity-50"
        >
          {removendo ? "Removendo..." : "remover"}
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="empresaId" value={empresaId} />
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Arquivo (.pfx)
        <input
          type="file"
          name="arquivo"
          accept=".pfx,.p12"
          required
          className="text-xs"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Senha do certificado
        <input
          type="password"
          name="senha"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar certificado"}
      </button>
      {erro && <p className="w-full text-sm text-red-600">{erro}</p>}
      <p className="w-full text-xs text-zinc-500">
        A senha nunca é exibida de volta nem guardada em texto simples — fica em um cofre criptografado à parte.
      </p>
    </form>
  );
}
