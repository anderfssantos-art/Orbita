"use client";

import { useState, useTransition } from "react";
import { registrarFerias, desligarFuncionario } from "@/app/actions/dp";

export function FuncionarioItem({
  funcionarioId,
  empresaId,
  nome,
  status,
  dataAdmissao,
  temFerias,
}: {
  funcionarioId: string;
  empresaId: string;
  nome: string;
  status: string;
  dataAdmissao: string;
  temFerias: boolean;
}) {
  const [mostrarFerias, setMostrarFerias] = useState(false);
  const [mostrarDesligar, setMostrarDesligar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function salvarFerias(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await registrarFerias(formData);
      if (r?.erro) setErro(r.erro);
      else setMostrarFerias(false);
    });
  }

  function salvarDesligamento(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await desligarFuncionario(formData);
      if (r?.erro) setErro(r.erro);
      else setMostrarDesligar(false);
    });
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-medium text-zinc-900">{nome}</span>{" "}
          <span className="text-xs text-zinc-500">· admitido em {dataAdmissao}</span>
          {temFerias && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              já tirou férias
            </span>
          )}
        </div>
        {status === "ativo" ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setMostrarFerias((v) => !v)} className="text-xs font-semibold text-emerald-700 hover:underline">
              registrar férias
            </button>
            <button onClick={() => setMostrarDesligar((v) => !v)} className="text-xs text-red-600 hover:underline">
              desligar
            </button>
          </div>
        ) : (
          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-600">demitido</span>
        )}
      </div>

      {mostrarFerias && (
        <form action={salvarFerias} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="funcionarioId" value={funcionarioId} />
          <input type="hidden" name="empresaId" value={empresaId} />
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Início
            <input name="inicio" type="date" required className="rounded-lg border border-zinc-300 px-2 py-1 text-xs" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Fim
            <input name="fim" type="date" required className="rounded-lg border border-zinc-300 px-2 py-1 text-xs" />
          </label>
          <button type="submit" disabled={pending} className="rounded-lg bg-emerald-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">
            salvar
          </button>
        </form>
      )}

      {mostrarDesligar && (
        <form action={salvarDesligamento} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="funcionarioId" value={funcionarioId} />
          <input type="hidden" name="empresaId" value={empresaId} />
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Data de demissão
            <input name="dataDemissao" type="date" required className="rounded-lg border border-zinc-300 px-2 py-1 text-xs" />
          </label>
          <button type="submit" disabled={pending} className="rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 disabled:opacity-50">
            confirmar
          </button>
        </form>
      )}

      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </li>
  );
}
