"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { revalidatePath } from "next/cache";

// Mesma sanitização usada no upload de documentos vinculados a pendência —
// o Supabase Storage rejeita chaves com acentos/espaços.
function sanitizarNomeArquivo(nome: string): string {
  const semAcentos = nome.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return semAcentos.replace(/[^a-zA-Z0-9.-]/g, "-").replace(/-+/g, "-");
}

/**
 * Recebe vários arquivos de uma vez sem exigir que já exista uma pendência
 * aberta esperando cada um deles. Usado tanto pela equipe (upload em lote)
 * quanto pelo cliente no portal — os dois lados caem na mesma caixa de
 * entrada, e a equipe depois vincula cada item a um documento pendente.
 */
export async function enviarDocumentosAvulsos(formData: FormData) {
  const empresaId = String(formData.get("empresaId") ?? "");
  const files = formData.getAll("files") as File[];

  if (!empresaId) return { erro: "Empresa não informada." };
  const validos = files.filter((f) => f && f.size > 0);
  if (validos.length === 0) return { erro: "Selecione ao menos um arquivo." };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Não autenticado." };

  const { data: empresa } = await supabase
    .from("empresas")
    .select("escritorio_id")
    .eq("id", empresaId)
    .maybeSingle();

  if (!empresa) return { erro: "Empresa não encontrada." };

  const usuario = await usuarioAtual(supabase);

  let enviados = 0;
  const erros: string[] = [];

  for (const file of validos) {
    const caminho = `${empresa.escritorio_id}/avulsos/${empresaId}/${Date.now()}-${sanitizarNomeArquivo(file.name)}`;

    const { error: uploadError } = await supabase.storage.from("documentos").upload(caminho, file);
    if (uploadError) {
      erros.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const { error: insertError } = await supabase.from("caixa_entrada_documentos").insert({
      escritorio_id: empresa.escritorio_id,
      empresa_id: empresaId,
      nome_arquivo: file.name,
      arquivo_url: caminho,
      enviado_por: usuario?.id ?? null,
    });
    if (insertError) {
      erros.push(`${file.name}: ${insertError.message}`);
      continue;
    }

    enviados++;
  }

  revalidatePath(`/empresas/${empresaId}`);
  revalidatePath("/portal");

  if (erros.length > 0) {
    return { erro: `${enviados} de ${validos.length} enviado(s). Falhas: ${erros.join("; ")}` };
  }
  return { sucesso: true, quantidade: enviados };
}

/**
 * Equipe vincula um item da caixa de entrada a um documento pendente real,
 * reaproveitando o mesmo efeito do upload direto: marca o documento como
 * recebido e fecha a pendência correspondente.
 */
export async function vincularDocumentoAvulso(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const documentoId = String(formData.get("documentoId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");

  if (!itemId || !documentoId) return { erro: "Selecione um documento para vincular." };

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("caixa_entrada_documentos")
    .select("arquivo_url, status")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) return { erro: "Item não encontrado." };
  if (item.status !== "pendente") return { erro: "Este item já foi tratado." };

  const { data: documento } = await supabase
    .from("documentos")
    .select("competencia_id, tipo")
    .eq("id", documentoId)
    .maybeSingle();

  if (!documento) return { erro: "Documento pendente não encontrado." };

  const { error: updateDocError } = await supabase
    .from("documentos")
    .update({ arquivo_url: item.arquivo_url, status: "recebido", recebido_em: new Date().toISOString() })
    .eq("id", documentoId);

  if (updateDocError) return { erro: "Não foi possível vincular: " + updateDocError.message };

  await supabase
    .from("pendencias")
    .update({ status: "resolvida", resolvida_em: new Date().toISOString() })
    .eq("competencia_id", documento.competencia_id)
    .eq("titulo", `Documento faltando: ${documento.tipo}`)
    .eq("status", "aberta");

  await supabase
    .from("caixa_entrada_documentos")
    .update({ status: "vinculado", documento_vinculado_id: documentoId })
    .eq("id", itemId);

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}

export async function descartarDocumentoAvulso(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");

  const supabase = await createClient();

  const { error } = await supabase
    .from("caixa_entrada_documentos")
    .update({ status: "descartado" })
    .eq("id", itemId);

  if (error) return { erro: "Não foi possível descartar: " + error.message };

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}
