"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { revalidatePath } from "next/cache";

// O Supabase Storage rejeita chaves com acentos, espaços e outros símbolos —
// nomes de arquivo reais (ex: "Comprovante de residência.pdf") quebravam o
// upload. Mantém só letras/números ASCII, ponto e hífen.
function sanitizarNomeArquivo(nome: string): string {
  const semAcentos = nome.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return semAcentos.replace(/[^a-zA-Z0-9.-]/g, "-").replace(/-+/g, "-");
}

export async function enviarDocumento(formData: FormData) {
  const documentoId = String(formData.get("documentoId") ?? "");
  const competenciaId = String(formData.get("competenciaId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) return { erro: "Selecione um arquivo." };

  const supabase = await createClient();

  const usuario = await usuarioAtual(supabase);

  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const caminho = `${usuario.escritorio_id}/${competenciaId}/${documentoId}-${sanitizarNomeArquivo(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(caminho, file, { upsert: true });

  if (uploadError) {
    return { erro: "Não foi possível enviar o arquivo: " + uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("documentos")
    .update({ arquivo_url: caminho, status: "recebido", recebido_em: new Date().toISOString() })
    .eq("id", documentoId);

  if (updateError) {
    return { erro: "Arquivo enviado, mas não foi possível atualizar o status: " + updateError.message };
  }

  // Fecha automaticamente a pendência que a pré-conferência abriu para este documento.
  await supabase
    .from("pendencias")
    .update({ status: "resolvida", resolvida_em: new Date().toISOString() })
    .eq("competencia_id", competenciaId)
    .eq("titulo", `Documento faltando: ${tipo}`)
    .eq("status", "aberta");

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}

export async function urlDocumento(documentoArquivoUrl: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(documentoArquivoUrl, 60);

  if (error || !data) return null;
  return data.signedUrl;
}
