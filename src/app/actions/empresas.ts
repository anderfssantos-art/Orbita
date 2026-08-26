"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { revalidatePath } from "next/cache";

export async function criarEmpresa(formData: FormData) {
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const razaoSocial = String(formData.get("razaoSocial") ?? "").trim();
  const regimeTributario = String(formData.get("regimeTributario") ?? "");

  if (!cnpj || !razaoSocial || !regimeTributario) {
    return { erro: "Preencha todos os campos." };
  }

  const supabase = await createClient();

  const usuario = await usuarioAtual(supabase);

  if (!usuario) {
    return { erro: "Usuário sem escritório vinculado." };
  }

  const { error } = await supabase.from("empresas").insert({
    escritorio_id: usuario.escritorio_id,
    cnpj,
    razao_social: razaoSocial,
    regime_tributario: regimeTributario,
  });

  if (error) {
    return { erro: "Não foi possível cadastrar: " + error.message };
  }

  revalidatePath("/empresas");
  return { sucesso: true };
}

export async function definirHonorario(formData: FormData) {
  const empresaId = String(formData.get("empresaId") ?? "");
  const honorarioRaw = String(formData.get("honorarioMensal") ?? "").replace(",", ".");
  const honorario = honorarioRaw ? Number(honorarioRaw) : null;

  if (honorarioRaw && (Number.isNaN(honorario) || (honorario as number) < 0)) {
    return { erro: "Valor inválido." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("empresas")
    .update({ honorario_mensal: honorario })
    .eq("id", empresaId);

  if (error) return { erro: "Não foi possível salvar: " + error.message };

  revalidatePath(`/empresas/${empresaId}`);
  revalidatePath("/rentabilidade");
  return { sucesso: true };
}
