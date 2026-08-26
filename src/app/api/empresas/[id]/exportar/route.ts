import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Escapa um campo para CSV: envolve em aspas se tiver vírgula, aspas ou quebra de linha.
function campoCsv(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function linhaCsv(campos: string[]): string {
  return campos.map(campoCsv).join(",") + "\r\n";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: empresaId } = await params;
  const competenciaId = request.nextUrl.searchParams.get("competenciaId");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("cnpj, razao_social")
    .eq("id", empresaId)
    .maybeSingle();

  if (!empresa) {
    return NextResponse.json({ erro: "Empresa não encontrada." }, { status: 404 });
  }

  let competenciaQuery = supabase
    .from("competencias")
    .select("id, referencia, status")
    .eq("empresa_id", empresaId);

  competenciaQuery = competenciaId
    ? competenciaQuery.eq("id", competenciaId)
    : competenciaQuery.order("referencia", { ascending: false }).limit(1);

  const { data: competencia } = await competenciaQuery.maybeSingle();

  if (!competencia) {
    return NextResponse.json({ erro: "Competência não encontrada." }, { status: 404 });
  }

  const [{ data: tarefas }, { data: documentos }] = await Promise.all([
    supabase
      .from("tarefas")
      .select("nome, setor, status, critica")
      .eq("competencia_id", competencia.id)
      .order("nome"),
    supabase
      .from("documentos")
      .select("tipo, status, recebido_em")
      .eq("competencia_id", competencia.id)
      .order("tipo"),
  ]);

  let csv = "﻿"; // BOM — Excel abre acentuação corretamente
  csv += linhaCsv(["Órbita — Resumo de competência"]);
  csv += linhaCsv(["Empresa", empresa.razao_social]);
  csv += linhaCsv(["CNPJ", empresa.cnpj]);
  csv += linhaCsv(["Competência", competencia.referencia]);
  csv += linhaCsv(["Status", competencia.status]);
  csv += "\r\n";

  csv += linhaCsv(["TAREFAS"]);
  csv += linhaCsv(["Nome", "Setor", "Status", "Crítica"]);
  for (const t of tarefas ?? []) {
    csv += linhaCsv([t.nome, t.setor, t.status, t.critica ? "Sim" : "Não"]);
  }
  csv += "\r\n";

  csv += linhaCsv(["DOCUMENTOS"]);
  csv += linhaCsv(["Tipo", "Status", "Recebido em"]);
  for (const d of documentos ?? []) {
    csv += linhaCsv([d.tipo, d.status, d.recebido_em ?? ""]);
  }

  const nomeArquivo = `orbita-${empresa.cnpj.replace(/\D/g, "")}-${competencia.referencia}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
