/**
 * Motor de regras determinísticas de auditoria/conformidade.
 *
 * Cada regra é uma função pura: recebe o contexto de uma competência e
 * devolve um alerta ou null. Versionadas aqui (git é a trilha de auditoria
 * das próprias regras) — nada disso é configurável por UI ainda, de
 * propósito, pra manter previsibilidade e evitar falso-positivo criado por
 * configuração errada de alguém sem contexto tributário.
 */

export type ContextoRegra = {
  empresa: { regime_tributario: string };
  competencia: { referencia: string; status: string };
  tarefas: { nome: string; critica: boolean; responsavel_id: string | null }[];
  servicosContratados: { nome: string }[];
};

export type AlertaGerado = {
  codigo: string;
  titulo: string;
  descricao: string;
  severidade: "alta" | "media" | "baixa";
  acaoRecomendada: string;
};

type Regra = {
  codigo: string;
  avaliar: (ctx: ContextoRegra) => AlertaGerado | null;
};

const regimesDispensadosDeEcf = ["Simples Nacional"];

const regras: Regra[] = [
  {
    // ECF (Escrituração Contábil Fiscal) é obrigatória para Lucro Real e
    // Presumido; empresas do Simples Nacional costumam ser dispensadas
    // (exceto casos específicos, como equiparação a distribuidora de
    // combustíveis). Contratar o serviço sem necessidade é retrabalho.
    codigo: "regime_ecf_incompativel",
    avaliar(ctx) {
      const temServicoEcf = ctx.servicosContratados.some((s) =>
        s.nome.toLowerCase().includes("ecf")
      );
      if (!temServicoEcf || !regimesDispensadosDeEcf.includes(ctx.empresa.regime_tributario)) {
        return null;
      }
      return {
        codigo: this.codigo,
        titulo: "SPED ECF contratado para empresa do Simples Nacional",
        descricao:
          "Empresas do Simples Nacional costumam ser dispensadas da entrega da ECF, salvo exceções (ex: equiparação a distribuidora de combustíveis). O serviço está contratado mesmo assim.",
        severidade: "media",
        acaoRecomendada:
          "Confirmar se esta empresa se enquadra em alguma exceção que exige a ECF. Se não, desvincular o serviço para não gerar trabalho desnecessário.",
      };
    },
  },
  {
    // Competência de um mês que já passou e continua aberta é sinal de
    // atraso operacional real, não hipótese — o mês seguinte já começou.
    codigo: "competencia_atrasada",
    avaliar(ctx) {
      if (ctx.competencia.status !== "aberta") return null;
      const referencia = new Date(ctx.competencia.referencia);
      const hoje = new Date();
      const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      if (referencia >= primeiroDiaMesAtual) return null;
      return {
        codigo: this.codigo,
        titulo: "Competência de mês anterior ainda aberta",
        descricao: `A competência de referência ${ctx.competencia.referencia} não foi fechada e já estamos em um mês seguinte.`,
        severidade: "alta",
        acaoRecomendada: "Verificar o que falta (tarefas, documentos ou pendências) e priorizar o fechamento.",
      };
    },
  },
  {
    // Tarefa crítica sem responsável definido não tem quem cobrar — o
    // prazo passa sem ninguém ser dono dela.
    codigo: "tarefa_critica_sem_responsavel",
    avaliar(ctx) {
      const semResponsavel = ctx.tarefas.filter((t) => t.critica && !t.responsavel_id);
      if (semResponsavel.length === 0) return null;
      return {
        codigo: this.codigo,
        titulo: `${semResponsavel.length} tarefa(s) crítica(s) sem responsável`,
        descricao: `Tarefas críticas sem responsável definido: ${semResponsavel.map((t) => t.nome).join(", ")}.`,
        severidade: "media",
        acaoRecomendada: "Atribuir um responsável a cada tarefa crítica antes do prazo.",
      };
    },
  },
];

export function avaliarRegras(ctx: ContextoRegra): AlertaGerado[] {
  return regras.map((r) => r.avaliar(ctx)).filter((a): a is AlertaGerado => a !== null);
}
