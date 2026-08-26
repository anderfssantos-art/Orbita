/**
 * Catálogo de marcos da transição da Reforma Tributária (CBS/IBS), com
 * vigência e fonte oficial — versionado em código, mesma lógica das regras
 * de auditoria (src/lib/regras-auditoria.ts). Datas conferidas em
 * ago/2026 contra a EC 132/2023 e a LC 214/2025; revisar se sair
 * legislação complementar nova.
 */

export type MarcoReforma = {
  codigo: string;
  inicio: string; // YYYY-MM-DD
  titulo: string;
  descricao: string;
  fonte: string;
};

export const marcosReforma: MarcoReforma[] = [
  {
    codigo: "2026_fase_teste",
    inicio: "2026-01-01",
    titulo: "2026 — Fase de testes (CBS 0,9% / IBS 0,1%)",
    descricao:
      "CBS e IBS passam a ser destacados nas notas fiscais em caráter informativo, com alíquotas simbólicas. PIS, Cofins, ICMS, ISS e IPI continuam valendo exatamente como antes — nenhuma mudança de base ou alíquota real.",
    fonte: "EC 132/2023 e LC 214/2025",
  },
  {
    codigo: "2027_cbs_integral",
    inicio: "2027-01-01",
    titulo: "2027 — CBS integral, fim de PIS/Cofins",
    descricao:
      "CBS passa a valer com alíquota cheia e recolhimento definitivo. PIS e Cofins são extintos. IPI zera para a maioria dos produtos (exceto os que concorrem com a Zona Franca de Manaus).",
    fonte: "EC 132/2023 e LC 214/2025",
  },
  {
    codigo: "2029_transicao_ibs_inicio",
    inicio: "2029-01-01",
    titulo: "2029 a 2032 — Transição gradual do IBS",
    descricao:
      "ICMS e ISS começam a ser reduzidos progressivamente (10%, 20%, 30%, 40% ao longo desses 4 anos) na mesma proporção em que o IBS assume a arrecadação.",
    fonte: "EC 132/2023 e LC 214/2025",
  },
  {
    codigo: "2033_implantacao_plena",
    inicio: "2033-01-01",
    titulo: "2033 — Implementação plena",
    descricao: "ICMS e ISS são extintos. IBS e CBS passam a ser os únicos tributos sobre consumo.",
    fonte: "EC 132/2023 e LC 214/2025",
  },
];

export function marcoAtual(hoje: Date = new Date()): MarcoReforma {
  const passados = marcosReforma.filter((m) => new Date(m.inicio) <= hoje);
  return passados[passados.length - 1] ?? marcosReforma[0];
}

export function proximoMarco(hoje: Date = new Date()): MarcoReforma | null {
  const futuros = marcosReforma.filter((m) => new Date(m.inicio) > hoje);
  return futuros[0] ?? null;
}

/**
 * Nota de impacto por regime — só orientação geral pra chamar atenção,
 * nunca um cálculo de valores. Simples Nacional tem regras de transição
 * próprias (ainda em regulamentação): pode optar por continuar só no DAS
 * ou recolher CBS/IBS por fora — por isso o texto pede confirmação em vez
 * de afirmar um caminho único.
 */
export function notaImpactoPorRegime(regime: string): string {
  if (regime === "Simples Nacional") {
    return "Simples Nacional tem regras de transição próprias (ainda em regulamentação): a empresa pode optar por seguir só no DAS ou recolher CBS/IBS por fora, dependendo do que for mais vantajoso. Vale confirmar a opção quando a Receita liberar o mecanismo.";
  }
  return "Fora do Simples, a extinção de PIS/Cofins em 2027 e a transição de ICMS/ISS a partir de 2029 afetam a apuração normal desta empresa — acompanhar o calendário é necessário, não opcional.";
}
