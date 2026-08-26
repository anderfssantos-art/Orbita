"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/supabase/usuario-atual";
import { parseCsvLine } from "@/lib/csv";
import { revalidatePath } from "next/cache";

export async function importarCarteira(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { erro: "Selecione um arquivo CSV." };

  const texto = await file.text();
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (linhas.length === 0) return { erro: "Arquivo vazio." };

  const primeiraLinha = parseCsvLine(linhas[0]).map((v) => v.toLowerCase());
  const temCabecalho = primeiraLinha.includes("cnpj");
  const linhasDados = temCabecalho ? linhas.slice(1) : linhas;

  if (linhasDados.length === 0) {
    return { erro: "Nenhuma linha de dados encontrada (só o cabeçalho)." };
  }

  const supabase = await createClient();
  const usuario = await usuarioAtual(supabase);

  if (!usuario) return { erro: "Usuário sem escritório vinculado." };

  const regimesValidos = ["Simples Nacional", "Lucro Presumido", "Lucro Real"];
  const validas: { escritorio_id: string; cnpj: string; razao_social: string; regime_tributario: string }[] = [];
  const erros: string[] = [];

  linhasDados.forEach((linha, i) => {
    const [cnpj, razaoSocial, regime] = parseCsvLine(linha);
    const numeroLinha = i + (temCabecalho ? 2 : 1);

    if (!cnpj || !razaoSocial || !regime) {
      erros.push(`Linha ${numeroLinha}: faltam colunas (esperado: cnpj, razão social, regime tributário).`);
      return;
    }
    if (!regimesValidos.includes(regime)) {
      erros.push(`Linha ${numeroLinha}: regime "${regime}" inválido (use Simples Nacional, Lucro Presumido ou Lucro Real).`);
      return;
    }

    validas.push({
      escritorio_id: usuario.escritorio_id,
      cnpj,
      razao_social: razaoSocial,
      regime_tributario: regime,
    });
  });

  if (validas.length === 0) {
    return { erro: "Nenhuma linha válida para importar.", detalhes: erros };
  }

  const { data: inseridas, error } = await supabase
    .from("empresas")
    .upsert(validas, { onConflict: "escritorio_id,cnpj", ignoreDuplicates: false })
    .select("id");

  if (error) {
    return { erro: "Falha ao importar: " + error.message, detalhes: erros };
  }

  revalidatePath("/empresas");
  return {
    sucesso: true,
    resumo: `${inseridas?.length ?? 0} empresa(s) importada(s)/atualizada(s).`,
    detalhes: erros,
  };
}
