"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function cadastrarClientePortal(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();

  if (!nome || !email || !senha || !codigo) {
    return { erro: "Preencha todos os campos." };
  }

  const supabase = await createClient();

  // O código de convite viaja nos metadados da conta — é lido de novo no
  // primeiro login (ver entrar(), em auth.ts), porque quando o e-mail
  // precisa de confirmação não existe sessão ativa aqui para usar o RPC
  // (auth.uid() ficaria nulo).
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, tipo: "cliente", codigo_convite: codigo } },
  });

  if (authError || !authData.user) {
    return { erro: authError?.message ?? "Não foi possível criar a conta." };
  }

  if (!authData.session) {
    return {
      sucesso: "Conta criada! Verifique seu e-mail para confirmar — depois é só entrar normalmente.",
    };
  }

  await supabase.auth.setSession({
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
  });

  const { error: vinculoError } = await supabase.rpc("vincular_cliente_portal", {
    p_codigo: codigo,
  });

  if (vinculoError) {
    return {
      erro:
        "Conta criada, mas o convite não pôde ser usado: " +
        vinculoError.message +
        " Peça um novo convite ao escritório.",
    };
  }

  redirect("/portal");
}
