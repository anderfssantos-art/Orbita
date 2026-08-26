/**
 * Motor de regras determinísticas de auditoria/conformidade.
 *
 * Cada regra é uma função pura: recebe o contexto de uma competência e
 * devolve um alerta ou null. Versionadas aqui (git é a trilha de auditoria
 * das próprias regras) — nada disso é configurável por UI ainda, de
 * propósito, pra manter previsibilidade e evitar falso-positivo criado por
 * configuração errada de alguém sem contexto tributário.
 */
import { decodificarChaveAcesso } from "./chave-acesso";

export type ContextoRegra = {
  empresa: { regime_tributario: string; honorario_mensal: number | null; cnpj: string };
  competencia: { referencia: string; status: string };
  tarefas: { nome: string; critica: boolean; responsavel_id: string | null }[];
  servicosContratados: { nome: string }[];
  certificados: { validade: string | null }[];
  documentos: { tipo: string; status: string; arquivo_url: string | null }[];
  documentosFiscais: { chaveAcesso: string | null; schema: string }[];
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
      // Compara só ano/mês como números — evitar `new Date(string)` aqui é
      // proposital: uma referencia "YYYY-MM-DD" vira meia-noite UTC, e
      // comparar isso com "meia-noite local" faz o mês corrente disparar
      // como atrasado sempre que o fuso local está atrás de UTC (Brasil).
      const [anoRef, mesRef] = ctx.competencia.referencia.split("-").map(Number);
      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const mesAtual = hoje.getMonth() + 1;
      const referenciaEhAnterior = anoRef < anoAtual || (anoRef === anoAtual && mesRef < mesAtual);
      if (!referenciaEhAnterior) return null;
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
  {
    // Sem certificado válido, a busca automática de XML falha silenciosamente
    // até alguém notar. Melhor avisar antes de faltar documento por causa
    // disso, não depois.
    codigo: "certificado_vencido_ou_vencendo",
    avaliar(ctx) {
      const comValidade = ctx.certificados.filter((c) => c.validade);
      if (comValidade.length === 0) return null;
      const maisRecente = comValidade.reduce((a, b) => (b.validade! > a.validade! ? b : a));
      const validade = new Date(maisRecente.validade!);
      const hoje = new Date();
      const diasRestantes = Math.ceil((validade.getTime() - hoje.getTime()) / 86400000);
      const dataFormatada = validade.toLocaleDateString("pt-BR", { timeZone: "UTC" });

      if (diasRestantes < 0) {
        return {
          codigo: this.codigo,
          titulo: "Certificado digital vencido",
          descricao: `O certificado desta empresa venceu em ${dataFormatada}. Buscas automáticas de XML vão falhar até renovar.`,
          severidade: "alta",
          acaoRecomendada: "Renovar o certificado A1 e enviar o novo arquivo na tela da empresa.",
        };
      }
      if (diasRestantes <= 30) {
        return {
          codigo: this.codigo,
          titulo: "Certificado digital vence em breve",
          descricao: `Vence em ${diasRestantes} dia(s), em ${dataFormatada}.`,
          severidade: "media",
          acaoRecomendada: "Providenciar a renovação com antecedência para não interromper a busca automática.",
        };
      }
      return null;
    },
  },
  {
    // Sem honorário definido, o painel de rentabilidade não consegue
    // calcular nada de útil pra essa empresa — é uma lacuna de cadastro,
    // não de operação, mas vale sinalizar.
    codigo: "honorario_nao_definido",
    avaliar(ctx) {
      if (ctx.empresa.honorario_mensal != null) return null;
      return {
        codigo: this.codigo,
        titulo: "Honorário mensal não definido",
        descricao: "Sem esse valor, o painel de Rentabilidade não consegue mostrar nada de útil sobre esta empresa.",
        severidade: "baixa",
        acaoRecomendada: "Definir o honorário mensal na tela da empresa.",
      };
    },
  },
  {
    // Emitir guia de imposto sem ter contratado a apuração é estranho o
    // suficiente pra merecer confirmação — mas pode ser legítimo se a
    // apuração for feita fora do Órbita, por isso severidade baixa.
    codigo: "emissao_sem_apuracao",
    avaliar(ctx) {
      const nomes = ctx.servicosContratados.map((s) => s.nome.toLowerCase());
      const temEmissao = nomes.some((n) => n.includes("emissão de guias") || n.includes("emissao de guias"));
      const temApuracao = nomes.some((n) => n.includes("apuração") || n.includes("apuracao"));
      if (!temEmissao || temApuracao) return null;
      return {
        codigo: this.codigo,
        titulo: "Emissão de guias contratada sem apuração de impostos",
        descricao:
          "A empresa tem o serviço de emissão de guias (DAS/ICMS/ISS) mas não tem apuração de impostos contratada no Órbita.",
        severidade: "baixa",
        acaoRecomendada: "Confirmar se a apuração é feita fora da plataforma ou se falta contratar o serviço.",
      };
    },
  },
  {
    // Documento marcado como recebido sem arquivo anexado é inconsistência
    // de dado pura — não devia acontecer nunca, então vale checar sempre.
    codigo: "documento_recebido_sem_arquivo",
    avaliar(ctx) {
      const inconsistentes = ctx.documentos.filter((d) => d.status === "recebido" && !d.arquivo_url);
      if (inconsistentes.length === 0) return null;
      return {
        codigo: this.codigo,
        titulo: `${inconsistentes.length} documento(s) marcado(s) como recebido sem arquivo`,
        descricao: `Tipos afetados: ${inconsistentes.map((d) => d.tipo).join(", ")}.`,
        severidade: "media",
        acaoRecomendada: "Verificar se o arquivo realmente foi enviado; se não, reabrir a pendência.",
      };
    },
  },
  {
    // Duas linhas com a mesma chave de acesso só acontecem por reprocessar
    // a busca de XML sem checar o que já existe, ou por bug de ingestão —
    // nunca é uma situação fiscal legítima.
    codigo: "nfe_duplicada",
    avaliar(ctx) {
      const contagem = new Map<string, number>();
      for (const doc of ctx.documentosFiscais) {
        if (!doc.chaveAcesso) continue;
        contagem.set(doc.chaveAcesso, (contagem.get(doc.chaveAcesso) ?? 0) + 1);
      }
      const duplicadas = [...contagem.entries()].filter(([, n]) => n > 1);
      if (duplicadas.length === 0) return null;
      return {
        codigo: this.codigo,
        titulo: `${duplicadas.length} nota(s) fiscal(is) duplicada(s) na base`,
        descricao: `Chave(s) de acesso repetida(s): ${duplicadas.map(([chave]) => chave.slice(-8)).join(", ")} (últimos 8 dígitos mostrados).`,
        severidade: "media",
        acaoRecomendada: "Conferir se é a mesma nota baixada duas vezes ou um erro de dado, e remover a duplicata.",
      };
    },
  },
  {
    // A distribuição de XML também traz eventos de cancelamento — se um
    // deles está entre os documentos baixados, a nota correspondente não
    // deve mais ser considerada válida para apuração.
    codigo: "nfe_com_cancelamento",
    avaliar(ctx) {
      const cancelamentos = ctx.documentosFiscais.filter((d) => /canc/i.test(d.schema));
      if (cancelamentos.length === 0) return null;
      return {
        codigo: this.codigo,
        titulo: `${cancelamentos.length} evento(s) de cancelamento de NF-e recebido(s)`,
        descricao: "Há evento de cancelamento entre os documentos baixados da Receita para esta empresa.",
        severidade: "alta",
        acaoRecomendada: "Confirmar que a nota cancelada não foi (ou não será) considerada na apuração de impostos.",
      };
    },
  },
  {
    // Quebra de sequência na numeração das notas que a própria empresa
    // emitiu (não nas que ela recebe) é um sinal clássico de nota fora do
    // sistema ou de falha na captura — não é 100% conclusivo (a empresa
    // pode ter cancelado/inutilizado a faixa por outro motivo legítimo),
    // por isso severidade baixa e ação de "confirmar", não "corrigir".
    codigo: "quebra_sequencia_numeracao",
    avaliar(ctx) {
      const cnpjLimpo = (ctx.empresa.cnpj ?? "").replace(/\D/g, "");
      if (!cnpjLimpo) return null;
      const proprias = ctx.documentosFiscais
        .map((d) => (d.chaveAcesso ? decodificarChaveAcesso(d.chaveAcesso) : null))
        .filter((d): d is NonNullable<typeof d> => d !== null && d.cnpj === cnpjLimpo);

      const porSerie = new Map<string, number[]>();
      for (const d of proprias) {
        const lista = porSerie.get(d.serie) ?? [];
        lista.push(d.numero);
        porSerie.set(d.serie, lista);
      }

      const lacunas: string[] = [];
      for (const [serie, numeros] of porSerie) {
        const ordenados = [...new Set(numeros)].sort((a, b) => a - b);
        for (let i = 1; i < ordenados.length; i++) {
          const salto = ordenados[i] - ordenados[i - 1];
          if (salto > 1) {
            lacunas.push(`série ${serie}: falta(m) ${salto - 1} número(s) entre ${ordenados[i - 1]} e ${ordenados[i]}`);
          }
        }
      }

      if (lacunas.length === 0) return null;
      return {
        codigo: this.codigo,
        titulo: "Quebra de sequência na numeração de notas emitidas",
        descricao: lacunas.join("; "),
        severidade: "baixa",
        acaoRecomendada: "Confirmar se os números faltando foram cancelados/inutilizados ou se há nota fora do sistema.",
      };
    },
  },
];

export function avaliarRegras(ctx: ContextoRegra): AlertaGerado[] {
  return regras.map((r) => r.avaliar(ctx)).filter((a): a is AlertaGerado => a !== null);
}
