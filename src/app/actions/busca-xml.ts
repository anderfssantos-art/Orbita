"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { buscarDocumentosFiscais } from "@/lib/nfe-distribuicao";

export async function buscarXmlDaEmpresa(formData: FormData) {
  const empresaId = String(formData.get("empresaId") ?? "");
  const certificadoId = String(formData.get("certificadoId") ?? "");
  const cUF = String(formData.get("cUF") ?? "");

  if (!cUF || cUF.length !== 2) {
    return { erro: "Informe o código IBGE da UF (2 dígitos, ex: 35 para SP)." };
  }

  const supabase = await createClient();

  const usuario = await usuarioAtual(supabase);
  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const { data: empresa } = await supabase
    .from("empresas")
    .select("cnpj")
    .eq("id", empresaId)
    .maybeSingle();

  if (!empresa) return { erro: "Empresa não encontrada." };

  const { data: dadosBrutos, error: rpcError } = await supabase
    .rpc("obter_certificado_decriptografado", { p_certificado_id: certificadoId })
    .single();

  if (rpcError || !dadosBrutos) {
    return { erro: "Não foi possível acessar o certificado: " + rpcError?.message };
  }

  const dados = dadosBrutos as { arquivo_base64: string; senha: string; ultimo_nsu: string };

  const resultado = await buscarDocumentosFiscais(
    dados.arquivo_base64,
    dados.senha,
    empresa.cnpj,
    dados.ultimo_nsu,
    cUF
  );

  if (resultado.sucesso) {
    if (resultado.documentos && resultado.documentos.length > 0) {
      await supabase
        .from("documentos_fiscais")
        .upsert(
          resultado.documentos.map((doc) => ({
            escritorio_id: usuario.escritorio_id,
            empresa_id: empresaId,
            nsu: doc.nsu,
            schema: doc.schema,
            chave_acesso: doc.chaveAcesso,
            xml: doc.xml,
          })),
          { onConflict: "empresa_id,nsu", ignoreDuplicates: true }
        );
    }

    if (resultado.ultNsu) {
      await supabase
        .from("certificados_digitais")
        .update({ ultimo_nsu: resultado.ultNsu })
        .eq("id", certificadoId);
    }
  }

  return {
    sucesso: resultado.sucesso,
    erro: resultado.erro,
    cStat: resultado.cStat,
    xMotivo: resultado.xMotivo,
    quantidadeDocumentos: resultado.documentos?.length ?? 0,
  };
}
