"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { revalidatePath } from "next/cache";

export async function criarFuncionario(formData: FormData) {
  const empresaId = String(formData.get("empresaId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").replace(/\D/g, "");
  const dataAdmissao = String(formData.get("dataAdmissao") ?? "");

  if (!empresaId || !nome || !cpf || !dataAdmissao) {
    return { erro: "Preencha nome, CPF e data de admissão." };
  }
  if (cpf.length !== 11) return { erro: "CPF deve ter 11 dígitos." };

  const supabase = await createClient();
  const usuario = await usuarioAtual(supabase);
  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const { error } = await supabase.from("funcionarios").insert({
    escritorio_id: usuario.escritorio_id,
    empresa_id: empresaId,
    nome,
    cpf,
    data_admissao: dataAdmissao,
  });

  if (error) return { erro: "Não foi possível cadastrar: " + error.message };

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}

export async function desligarFuncionario(formData: FormData) {
  const funcionarioId = String(formData.get("funcionarioId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");
  const dataDemissao = String(formData.get("dataDemissao") ?? "");

  if (!dataDemissao) return { erro: "Informe a data de demissão." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("funcionarios")
    .update({ status: "demitido", data_demissao: dataDemissao })
    .eq("id", funcionarioId);

  if (error) return { erro: "Não foi possível registrar: " + error.message };

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}

export async function registrarFerias(formData: FormData) {
  const funcionarioId = String(formData.get("funcionarioId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");
  const inicio = String(formData.get("inicio") ?? "");
  const fim = String(formData.get("fim") ?? "");

  if (!inicio || !fim) return { erro: "Informe início e fim das férias." };
  if (fim < inicio) return { erro: "Fim não pode ser antes do início." };

  const supabase = await createClient();
  const usuario = await usuarioAtual(supabase);
  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const { error } = await supabase.from("ferias").insert({
    escritorio_id: usuario.escritorio_id,
    funcionario_id: funcionarioId,
    inicio,
    fim,
  });

  if (error) return { erro: "Não foi possível registrar: " + error.message };

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}
