"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";

function gerarCodigo() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem caracteres ambíguos
  let codigo = "";
  for (let i = 0; i < 8; i++) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return codigo;
}

export async function gerarConvite(formData: FormData) {
  const empresaId = String(formData.get("empresaId") ?? "");
  if (!empresaId) return { erro: "Empresa inválida." };

  const supabase = await createClient();
  const usuario = await usuarioAtual(supabase);

  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const codigo = gerarCodigo();

  const { error } = await supabase.from("convites_cliente").insert({
    escritorio_id: usuario.escritorio_id,
    empresa_id: empresaId,
    codigo,
  });

  if (error) return { erro: "Não foi possível gerar o convite: " + error.message };

  return { sucesso: true, codigo };
}
