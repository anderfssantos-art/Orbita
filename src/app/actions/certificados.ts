"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import forge from "node-forge";

function extrairValidade(bufferPfx: Buffer, senha: string): Date | null {
  try {
    const p12Asn1 = forge.asn1.fromDer(
      forge.util.createBuffer(bufferPfx.toString("binary"))
    );
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

    for (const safeContents of p12.safeContents) {
      for (const safeBag of safeContents.safeBags) {
        if (safeBag.cert) {
          return safeBag.cert.validity.notAfter;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function enviarCertificado(formData: FormData) {
  const empresaId = String(formData.get("empresaId") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const file = formData.get("arquivo") as File | null;

  if (!empresaId || !senha || !file || file.size === 0) {
    return { erro: "Selecione o arquivo .pfx e informe a senha." };
  }

  if (!file.name.toLowerCase().endsWith(".pfx") && !file.name.toLowerCase().endsWith(".p12")) {
    return { erro: "O arquivo precisa ser .pfx ou .p12." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const validade = extrairValidade(buffer, senha);
  if (!validade) {
    return {
      erro: "Não foi possível abrir o certificado — confira se a senha está correta.",
    };
  }

  const supabase = await createClient();

  const { data: certificadoId, error } = await supabase.rpc("salvar_certificado_digital", {
    p_empresa_id: empresaId,
    p_nome_arquivo: file.name,
    p_arquivo_base64: buffer.toString("base64"),
    p_senha: senha,
    p_validade: validade.toISOString().slice(0, 10),
  });

  if (error) {
    return { erro: "Não foi possível salvar o certificado: " + error.message };
  }

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true, validade: validade.toISOString().slice(0, 10), certificadoId };
}

export async function removerCertificado(formData: FormData) {
  const certificadoId = String(formData.get("certificadoId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("remover_certificado_digital", {
    p_certificado_id: certificadoId,
  });

  if (error) {
    return { erro: "Não foi possível remover: " + error.message };
  }

  revalidatePath(`/empresas/${empresaId}`);
  return { sucesso: true };
}
