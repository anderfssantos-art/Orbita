import { NextResponse } from "next/server";

// Rota temporária de diagnóstico — remover depois de resolver o problema
// de deploy. Não expõe o valor real, só metadados para identificar corrupção.
function diagnosticar(valor: string | undefined) {
  if (!valor) return { existe: false };
  const chars = [...valor];
  const foraDoIntervalo = chars
    .map((c, i) => ({ i, code: c.charCodeAt(0) }))
    .filter((c) => c.code > 255);
  return {
    existe: true,
    tamanho: valor.length,
    inicio: valor.slice(0, 10),
    fim: valor.slice(-6),
    temCaracterForaDoIntervalo: foraDoIntervalo.length > 0,
    primeirosForaDoIntervalo: foraDoIntervalo.slice(0, 5),
  };
}

export async function GET() {
  return NextResponse.json({
    url: diagnosticar(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: diagnosticar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
