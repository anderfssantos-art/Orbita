"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { avaliarRegras } from "@/lib/regras-auditoria";
import { revalidatePath } from "next/cache";

export async function rodarAuditoria(formData: FormData) {
  const competenciaId = String(formData.get("competenciaId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");

  if (!competenciaId || !empresaId) return { erro: "Dados inválidos." };

  const supabase = await createClient();

  const usuario = await usuarioAtual(supabase);
  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const [{ data: empresa }, { data: competencia }, { data: tarefas }, { data: contratados }] =
    await Promise.all([
      supabase.from("empresas").select("regime_tributario").eq("id", empresaId).maybeSingle(),
      supabase.from("competencias").select("referencia, status").eq("id", competenciaId).maybeSingle(),
      supabase
        .from("tarefas")
        .select("nome, critica, responsavel_id")
        .eq("competencia_id", competenciaId),
      supabase.from("empresa_servicos").select("servicos(nome)").eq("empresa_id", empresaId),
    ]);

  if (!empresa || !competencia) return { erro: "Competência ou empresa não encontrada." };

  const servicosContratados = (contratados ?? [])
    .map((row) => row.servicos)
    .filter(Boolean) as unknown as { nome: string }[];

  const alertas = avaliarRegras({
    empresa,
    competencia,
    tarefas: tarefas ?? [],
    servicosContratados,
  });

  if (alertas.length > 0) {
    await supabase.from("alertas_auditoria").upsert(
      alertas.map((a) => ({
        escritorio_id: usuario.escritorio_id,
        competencia_id: competenciaId,
        regra_codigo: a.codigo,
        titulo: a.titulo,
        descricao: a.descricao,
        severidade: a.severidade,
        acao_recomendada: a.acaoRecomendada,
        status: "aberto",
      })),
      { onConflict: "competencia_id,regra_codigo", ignoreDuplicates: false }
    );
  }

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true, quantidade: alertas.length };
}

export async function tratarAlerta(formData: FormData) {
  const alertaId = String(formData.get("alertaId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!["resolvido", "ignorado"].includes(status)) return;

  const supabase = await createClient();

  await supabase
    .from("alertas_auditoria")
    .update({ status, tratado_em: new Date().toISOString() })
    .eq("id", alertaId);

  revalidatePath(`/empresas/${empresaId}`);
}
