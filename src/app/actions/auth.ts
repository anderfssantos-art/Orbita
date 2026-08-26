"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { redirect } from "next/navigation";

export async function cadastrarEscritorio(formData: FormData) {
  const nomeEscritorio = String(formData.get("nomeEscritorio") ?? "").trim();
  const nomeUsuario = String(formData.get("nomeUsuario") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!nomeEscritorio || !nomeUsuario || !email || !senha) {
    return { erro: "Preencha todos os campos." };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
  });

  if (authError || !authData.user) {
    return { erro: authError?.message ?? "Não foi possível criar a conta." };
  }

  if (!authData.session) {
    return {
      sucesso: "Conta criada! Verifique seu e-mail para confirmar o cadastro — depois de confirmar, entre normalmente para terminar de montar o escritório.",
    };
  }

  // Sem isso, a chamada seguinte na mesma requisição não enxerga a sessão
  // que acabou de nascer no signUp — auth.uid() ficaria nulo dentro do RPC.
  await supabase.auth.setSession({
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
  });

  // Escritório e usuário gestor nascem juntos, numa única transação no banco:
  // se algo falhar, nada fica pela metade (ver função criar_escritorio_e_usuario).
  const { error: rpcError } = await supabase.rpc("criar_escritorio_e_usuario", {
    p_nome_escritorio: nomeEscritorio,
    p_nome_usuario: nomeUsuario,
  });

  if (rpcError) {
    return {
      erro:
        "Conta criada, mas não foi possível montar o escritório: " +
        rpcError.message +
        ". Tente entrar com o e-mail e senha que você acabou de definir — se o problema persistir, fale com o suporte.",
    };
  }

  redirect("/empresas");
}

export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return { erro: "E-mail ou senha inválidos." };
  }

  const usuario = await usuarioAtual(supabase);
  if (usuario) redirect("/empresas");

  // Cliente do portal: se o convite não pôde ser aplicado no cadastro
  // (e-mail ainda não confirmado naquele momento), completa agora, no
  // primeiro login — é quando a sessão passa a existir de verdade.
  const { data: { user } } = await supabase.auth.getUser();
  const { data: acesso } = await supabase
    .from("acessos_cliente")
    .select("id")
    .eq("usuario_auth_id", user!.id)
    .maybeSingle();

  const codigoConvite = user?.user_metadata?.codigo_convite as string | undefined;
  if (!acesso && codigoConvite) {
    await supabase.rpc("vincular_cliente_portal", { p_codigo: codigoConvite });
  }

  redirect("/portal");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
