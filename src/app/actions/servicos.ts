"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { revalidatePath } from "next/cache";

export async function criarServico(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const setor = String(formData.get("setor") ?? "");
  const critica = formData.get("critica") === "on";
  const documentosRaw = String(formData.get("documentosNecessarios") ?? "");
  const documentosNecessarios = documentosRaw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  if (!nome || !setor) {
    return { erro: "Preencha nome e setor." };
  }

  const supabase = await createClient();

  const usuario = await usuarioAtual(supabase);

  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const { error } = await supabase.from("servicos").insert({
    escritorio_id: usuario.escritorio_id,
    nome,
    setor,
    critica,
    documentos_necessarios: documentosNecessarios,
  });

  if (error) return { erro: "Não foi possível salvar: " + error.message };

  revalidatePath("/servicos");
  return { sucesso: true };
}

export async function vincularServico(formData: FormData) {
  const empresaId = String(formData.get("empresaId") ?? "");
  const servicoId = String(formData.get("servicoId") ?? "");

  if (!empresaId || !servicoId) return { erro: "Selecione um serviço." };

  const supabase = await createClient();

  const usuario = await usuarioAtual(supabase);

  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const { error } = await supabase.from("empresa_servicos").insert({
    escritorio_id: usuario.escritorio_id,
    empresa_id: empresaId,
    servico_id: servicoId,
  });

  if (error) return { erro: "Não foi possível vincular: " + error.message };

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}

export async function desvincularServico(formData: FormData) {
  const empresaId = String(formData.get("empresaId") ?? "");
  const servicoId = String(formData.get("servicoId") ?? "");

  const supabase = await createClient();
  await supabase
    .from("empresa_servicos")
    .delete()
    .eq("empresa_id", empresaId)
    .eq("servico_id", servicoId);

  revalidatePath(`/empresas/${empresaId}`);
}
