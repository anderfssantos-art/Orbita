/**
 * Catálogo de planos comerciais — versionado em código, mesmo padrão das
 * regras de auditoria e dos marcos da reforma tributária. Ainda sem
 * cobrança de verdade integrada (nenhum processador de pagamento
 * escolhido/configurado): isso aqui só define os limites que a aplicação
 * já pode aplicar hoje, e serve de base pro dia em que a cobrança entrar.
 */

export type Plano = {
  codigo: string;
  nome: string;
  precoMensal: number | null; // null = sob consulta
  limiteEmpresas: number | null; // null = ilimitado
  descricao: string;
};

export const planos: Record<string, Plano> = {
  trial: {
    codigo: "trial",
    nome: "Trial",
    precoMensal: 0,
    limiteEmpresas: 3,
    descricao: "Experimente com até 3 empresas antes de assinar.",
  },
  solo: {
    codigo: "solo",
    nome: "Solo",
    precoMensal: 97,
    limiteEmpresas: 15,
    descricao: "Para contadores autônomos e escritórios de uma pessoa só.",
  },
  equipe: {
    codigo: "equipe",
    nome: "Equipe",
    precoMensal: 247,
    limiteEmpresas: 60,
    descricao: "Para escritórios com mais de um colaborador.",
  },
  escritorio: {
    codigo: "escritorio",
    nome: "Escritório",
    precoMensal: null,
    limiteEmpresas: null,
    descricao: "Carteira grande, sem limite de empresas. Sob consulta.",
  },
};

export function planoDe(codigo: string): Plano {
  return planos[codigo] ?? planos.trial;
}
