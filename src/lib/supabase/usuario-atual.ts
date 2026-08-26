import type { SupabaseClient } from "@supabase/supabase-js";

export type UsuarioAtual = {
  id: string;
  escritorio_id: string;
  nome: string;
  perfil: string;
  setor: string | null;
};

/**
 * Sempre filtra pelo id do usuário autenticado (auth.uid()), nunca por
 * RLS implícito — a política de isolamento é por escritório, então um
 * `.single()` sem esse filtro quebra assim que o escritório tem mais de
 * um colaborador (várias linhas ficam visíveis, não só a própria).
 */
export async function usuarioAtual(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<UsuarioAtual | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("id, escritorio_id, nome, perfil, setor")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}
