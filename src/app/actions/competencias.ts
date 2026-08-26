"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { revalidatePath } from "next/cache";

function primeiroDiaDoMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
}

export async function abrirCompetencia(formData: FormData) {
  const empresaId = String(formData.get("empresaId") ?? "");
  if (!empresaId) return { erro: "Empresa inválida." };

  const supabase = await createClient();

  const usuario = await usuarioAtual(supabase);

  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const referencia = primeiroDiaDoMesAtual();

  // Já existe competência aberta para este mês? Não duplica.
  const { data: existente } = await supabase
    .from("competencias")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("referencia", referencia)
    .maybeSingle();

  if (existente) {
    return { erro: "Já existe uma competência para este mês." };
  }

  const { data: competencia, error: competenciaError } = await supabase
    .from("competencias")
    .insert({
      escritorio_id: usuario.escritorio_id,
      empresa_id: empresaId,
      referencia,
      status: "aberta",
    })
    .select("id")
    .single();

  if (competenciaError || !competencia) {
    return {
      erro: "Não foi possível abrir a competência: " + competenciaError?.message,
    };
  }

  // Serviços contratados pela empresa definem as tarefas e documentos esperados.
  const { data: servicosContratados } = await supabase
    .from("empresa_servicos")
    .select("servicos(id, nome, setor, critica, exige_revisao_4_olhos, documentos_necessarios)")
    .eq("empresa_id", empresaId);

  const servicos = (servicosContratados ?? [])
    .map((row) => row.servicos)
    .filter(Boolean) as unknown as {
    id: string;
    nome: string;
    setor: string;
    critica: boolean;
    exige_revisao_4_olhos: boolean;
    documentos_necessarios: string[];
  }[];

  if (servicos.length === 0) {
    return {
      aviso:
        "Competência aberta, mas a empresa não tem nenhum serviço contratado — nenhuma tarefa foi gerada.",
    };
  }

  const tarefas = servicos.map((servico) => ({
    escritorio_id: usuario.escritorio_id,
    competencia_id: competencia.id,
    servico_id: servico.id,
    nome: servico.nome,
    setor: servico.setor,
    critica: servico.critica,
    exige_revisao_4_olhos: servico.exige_revisao_4_olhos,
    status: "pendente",
  }));

  // Serviços diferentes podem exigir o mesmo tipo de documento (ex: XML de
  // entrada serve tanto pra apuração quanto pra escrituração fiscal) — um
  // pedido só por tipo, não um por serviço que o usa.
  const tiposUnicos = [...new Set(servicos.flatMap((servico) => servico.documentos_necessarios))];
  const documentos = tiposUnicos.map((tipo) => ({
    escritorio_id: usuario.escritorio_id,
    competencia_id: competencia.id,
    tipo,
    origem: "esperado",
    status: "faltando",
  }));

  const { error: tarefasError } = await supabase.from("tarefas").insert(tarefas);
  if (tarefasError) {
    return { erro: "Competência aberta, mas falhou ao gerar tarefas: " + tarefasError.message };
  }

  if (documentos.length > 0) {
    const { error: documentosError } = await supabase
      .from("documentos")
      .insert(documentos);
    if (documentosError) {
      return {
        erro: "Tarefas geradas, mas falhou ao gerar documentos: " + documentosError.message,
      };
    }
  }

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}

export async function marcarTarefaConcluida(formData: FormData) {
  const tarefaId = String(formData.get("tarefaId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase
    .from("tarefas")
    .update({ status: "concluida", concluida_por_id: user?.id ?? null })
    .eq("id", tarefaId);

  revalidatePath(`/empresas/${empresaId}`);
}

export async function aprovarTarefa(formData: FormData) {
  const tarefaId = String(formData.get("tarefaId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão inválida." };

  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("concluida_por_id")
    .eq("id", tarefaId)
    .single();

  if (!tarefa) return { erro: "Tarefa não encontrada." };

  if (!tarefa.concluida_por_id) {
    return {
      erro: "Esta tarefa não tem um executor registrado — não é possível aprovar sem saber quem concluiu.",
    };
  }

  if (tarefa.concluida_por_id === user.id) {
    return {
      erro: "O revisor precisa ser diferente de quem concluiu a tarefa (regra dos 4 olhos).",
    };
  }

  const { error } = await supabase
    .from("tarefas")
    .update({ aprovada_por_id: user.id })
    .eq("id", tarefaId);

  if (error) return { erro: "Não foi possível aprovar: " + error.message };

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}

export async function rodarPreConferencia(formData: FormData) {
  const competenciaId = String(formData.get("competenciaId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");

  const supabase = await createClient();
  const usuario = await usuarioAtual(supabase);
  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const { data: documentosFaltando } = await supabase
    .from("documentos")
    .select("id, tipo")
    .eq("competencia_id", competenciaId)
    .eq("status", "faltando");

  const { data: pendenciasExistentes } = await supabase
    .from("pendencias")
    .select("titulo")
    .eq("competencia_id", competenciaId)
    .eq("status", "aberta");

  const titulosExistentes = new Set((pendenciasExistentes ?? []).map((p) => p.titulo));

  const novasPendencias = (documentosFaltando ?? [])
    .map((doc) => ({
      escritorio_id: usuario.escritorio_id,
      competencia_id: competenciaId,
      titulo: `Documento faltando: ${doc.tipo}`,
      descricao: "Gerado automaticamente pela pré-conferência.",
      severidade: "alta",
      status: "aberta",
    }))
    .filter((p) => !titulosExistentes.has(p.titulo));

  if (novasPendencias.length === 0) {
    revalidatePath(`/empresas/${empresaId}`);
    return { aviso: "Nenhuma pendência nova — todos os documentos esperados já foram recebidos." };
  }

  const { error } = await supabase.from("pendencias").insert(novasPendencias);
  if (error) return { erro: "Não foi possível gerar as pendências: " + error.message };

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}

export async function fecharCompetencia(formData: FormData) {
  const competenciaId = String(formData.get("competenciaId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");

  const supabase = await createClient();

  const { data: pendenciasBloqueando } = await supabase
    .from("pendencias")
    .select("titulo")
    .eq("competencia_id", competenciaId)
    .eq("status", "aberta")
    .in("severidade", ["alta", "media"]);

  if (pendenciasBloqueando && pendenciasBloqueando.length > 0) {
    return {
      erro: `Não é possível fechar: ${pendenciasBloqueando.length} pendência(s) em aberto — ${pendenciasBloqueando.map((p) => p.titulo).join("; ")}`,
    };
  }

  const { data: criticasSemAprovacao } = await supabase
    .from("tarefas")
    .select("nome")
    .eq("competencia_id", competenciaId)
    .eq("critica", true)
    .or("status.neq.concluida,and(exige_revisao_4_olhos.eq.true,aprovada_por_id.is.null)");

  if (criticasSemAprovacao && criticasSemAprovacao.length > 0) {
    return {
      erro: `Não é possível fechar: tarefa(s) crítica(s) sem revisão em 4 olhos — ${criticasSemAprovacao.map((t) => t.nome).join("; ")}`,
    };
  }

  const { error } = await supabase
    .from("competencias")
    .update({ status: "fechada", fechada_em: new Date().toISOString() })
    .eq("id", competenciaId);

  if (error) return { erro: "Não foi possível fechar: " + error.message };

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}
