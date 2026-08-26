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

  const [
    { data: empresa },
    { data: competencia },
    { data: tarefas },
    { data: contratados },
    { data: certificados },
    { data: documentos },
    { data: documentosFiscais },
  ] = await Promise.all([
    supabase.from("empresas").select("regime_tributario, honorario_mensal, cnpj").eq("id", empresaId).maybeSingle(),
    supabase.from("competencias").select("referencia, status").eq("id", competenciaId).maybeSingle(),
    supabase
      .from("tarefas")
      .select("nome, critica, responsavel_id")
      .eq("competencia_id", competenciaId),
    supabase.from("empresa_servicos").select("servicos(nome)").eq("empresa_id", empresaId),
    supabase.from("certificados_digitais").select("validade").eq("empresa_id", empresaId),
    supabase.from("documentos").select("tipo, status, arquivo_url").eq("competencia_id", competenciaId),
    supabase.from("documentos_fiscais").select("chave_acesso, schema").eq("empresa_id", empresaId),
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
    certificados: certificados ?? [],
    documentos: documentos ?? [],
    documentosFiscais: (documentosFiscais ?? []).map((d) => ({ chaveAcesso: d.chave_acesso, schema: d.schema })),
  });

  const codigosQueDisparam = new Set(alertas.map((a) => a.codigo));

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

  // Regra que não dispara mais (o problema foi corrigido) fecha sozinha o
  // alerta que ela tinha aberto antes — senão fica pra sempre na tela.
  const { data: alertasAbertos } = await supabase
    .from("alertas_auditoria")
    .select("id, regra_codigo")
    .eq("competencia_id", competenciaId)
    .eq("status", "aberto");

  const idsParaFechar = (alertasAbertos ?? [])
    .filter((a) => !codigosQueDisparam.has(a.regra_codigo))
    .map((a) => a.id);

  if (idsParaFechar.length > 0) {
    await supabase
      .from("alertas_auditoria")
      .update({ status: "resolvido", tratado_em: new Date().toISOString() })
      .in("id", idsParaFechar);
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
