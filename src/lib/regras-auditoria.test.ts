import { describe, it, expect } from "vitest";
import { avaliarRegras, type ContextoRegra } from "./regras-auditoria";

function baseCtx(overrides: Partial<ContextoRegra> = {}): ContextoRegra {
  return {
    empresa: { regime_tributario: "Lucro Presumido", honorario_mensal: 500, cnpj: "33508879000136" },
    competencia: { referencia: "2026-08-01", status: "aberta" },
    tarefas: [],
    servicosContratados: [],
    certificados: [],
    documentos: [],
    documentosFiscais: [],
    funcionarios: [],
    ...overrides,
  };
}

function chaveComNumero(cnpj: string, serie: string, numero: number): string {
  const numeroStr = String(numero).padStart(9, "0");
  return `35${"2608"}${cnpj}${"55"}${serie}${numeroStr}${"1"}${"12345678"}${"9"}`;
}

describe("regime_ecf_incompativel", () => {
  it("dispara quando Simples Nacional contrata SPED ECF", () => {
    const alertas = avaliarRegras(
      baseCtx({
        empresa: { regime_tributario: "Simples Nacional", honorario_mensal: 500, cnpj: "33508879000136" },
        servicosContratados: [{ nome: "SPED ECF (fiscal)" }],
      })
    );
    expect(alertas.map((a) => a.codigo)).toContain("regime_ecf_incompativel");
  });

  it("não dispara para Lucro Presumido com SPED ECF (é obrigatório, não é erro)", () => {
    const alertas = avaliarRegras(
      baseCtx({
        empresa: { regime_tributario: "Lucro Presumido", honorario_mensal: 500, cnpj: "33508879000136" },
        servicosContratados: [{ nome: "SPED ECF (fiscal)" }],
      })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("regime_ecf_incompativel");
  });

  it("não dispara para Simples Nacional sem SPED ECF contratado", () => {
    const alertas = avaliarRegras(
      baseCtx({
        empresa: { regime_tributario: "Simples Nacional", honorario_mensal: 500, cnpj: "33508879000136" },
        servicosContratados: [{ nome: "Processamento da folha de pagamento" }],
      })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("regime_ecf_incompativel");
  });
});

describe("competencia_atrasada", () => {
  it("dispara para competência aberta de um mês anterior ao atual", () => {
    const alertas = avaliarRegras(baseCtx({ competencia: { referencia: "2020-01-01", status: "aberta" } }));
    expect(alertas.map((a) => a.codigo)).toContain("competencia_atrasada");
  });

  it("não dispara para competência fechada, mesmo que antiga", () => {
    const alertas = avaliarRegras(baseCtx({ competencia: { referencia: "2020-01-01", status: "fechada" } }));
    expect(alertas.map((a) => a.codigo)).not.toContain("competencia_atrasada");
  });

  it("não dispara para o mês corrente", () => {
    const hoje = new Date();
    const referencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
    const alertas = avaliarRegras(baseCtx({ competencia: { referencia, status: "aberta" } }));
    expect(alertas.map((a) => a.codigo)).not.toContain("competencia_atrasada");
  });
});

describe("tarefa_critica_sem_responsavel", () => {
  it("dispara quando há tarefa crítica sem responsável", () => {
    const alertas = avaliarRegras(
      baseCtx({ tarefas: [{ nome: "SPED ECF", critica: true, responsavel_id: null }] })
    );
    expect(alertas.map((a) => a.codigo)).toContain("tarefa_critica_sem_responsavel");
  });

  it("não dispara quando a tarefa crítica já tem responsável", () => {
    const alertas = avaliarRegras(
      baseCtx({ tarefas: [{ nome: "SPED ECF", critica: true, responsavel_id: "user-1" }] })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("tarefa_critica_sem_responsavel");
  });

  it("não dispara para tarefa sem responsável se ela não for crítica", () => {
    const alertas = avaliarRegras(
      baseCtx({ tarefas: [{ nome: "Emissão de guias", critica: false, responsavel_id: null }] })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("tarefa_critica_sem_responsavel");
  });
});

describe("certificado_vencido_ou_vencendo", () => {
  it("dispara com severidade alta para certificado já vencido", () => {
    const alertas = avaliarRegras(baseCtx({ certificados: [{ validade: "2020-01-01" }] }));
    const alerta = alertas.find((a) => a.codigo === "certificado_vencido_ou_vencendo");
    expect(alerta?.severidade).toBe("alta");
  });

  it("dispara com severidade média para certificado vencendo em até 30 dias", () => {
    const em15dias = new Date();
    em15dias.setDate(em15dias.getDate() + 15);
    const alertas = avaliarRegras(
      baseCtx({ certificados: [{ validade: em15dias.toISOString().slice(0, 10) }] })
    );
    const alerta = alertas.find((a) => a.codigo === "certificado_vencido_ou_vencendo");
    expect(alerta?.severidade).toBe("media");
  });

  it("não dispara para certificado válido por mais de 30 dias", () => {
    const em90dias = new Date();
    em90dias.setDate(em90dias.getDate() + 90);
    const alertas = avaliarRegras(
      baseCtx({ certificados: [{ validade: em90dias.toISOString().slice(0, 10) }] })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("certificado_vencido_ou_vencendo");
  });

  it("não dispara quando a empresa não tem certificado cadastrado", () => {
    const alertas = avaliarRegras(baseCtx({ certificados: [] }));
    expect(alertas.map((a) => a.codigo)).not.toContain("certificado_vencido_ou_vencendo");
  });
});

describe("honorario_nao_definido", () => {
  it("dispara quando honorario_mensal é null", () => {
    const alertas = avaliarRegras(
      baseCtx({ empresa: { regime_tributario: "Lucro Presumido", honorario_mensal: null, cnpj: "33508879000136" } })
    );
    expect(alertas.map((a) => a.codigo)).toContain("honorario_nao_definido");
  });

  it("não dispara quando honorario_mensal está definido, mesmo que zero", () => {
    const alertas = avaliarRegras(
      baseCtx({ empresa: { regime_tributario: "Lucro Presumido", honorario_mensal: 0, cnpj: "33508879000136" } })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("honorario_nao_definido");
  });
});

describe("emissao_sem_apuracao", () => {
  it("dispara quando tem emissão de guias sem apuração", () => {
    const alertas = avaliarRegras(
      baseCtx({ servicosContratados: [{ nome: "Emissão de guias (DAS, ICMS, ISS)" }] })
    );
    expect(alertas.map((a) => a.codigo)).toContain("emissao_sem_apuracao");
  });

  it("não dispara quando os dois serviços estão contratados", () => {
    const alertas = avaliarRegras(
      baseCtx({
        servicosContratados: [
          { nome: "Emissão de guias (DAS, ICMS, ISS)" },
          { nome: "Apuração de impostos (Simples/Presumido/Real)" },
        ],
      })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("emissao_sem_apuracao");
  });
});

describe("documento_recebido_sem_arquivo", () => {
  it("dispara para documento recebido sem arquivo_url", () => {
    const alertas = avaliarRegras(
      baseCtx({ documentos: [{ tipo: "XML de entrada", status: "recebido", arquivo_url: null }] })
    );
    expect(alertas.map((a) => a.codigo)).toContain("documento_recebido_sem_arquivo");
  });

  it("não dispara para documento recebido com arquivo_url preenchido", () => {
    const alertas = avaliarRegras(
      baseCtx({ documentos: [{ tipo: "XML de entrada", status: "recebido", arquivo_url: "caminho/arquivo.xml" }] })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("documento_recebido_sem_arquivo");
  });

  it("não dispara para documento faltando sem arquivo (é o esperado)", () => {
    const alertas = avaliarRegras(
      baseCtx({ documentos: [{ tipo: "XML de entrada", status: "faltando", arquivo_url: null }] })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("documento_recebido_sem_arquivo");
  });
});

describe("nfe_duplicada", () => {
  it("dispara quando a mesma chave de acesso aparece duas vezes", () => {
    const chave = chaveComNumero("33508879000136", "001", 100);
    const alertas = avaliarRegras(
      baseCtx({
        documentosFiscais: [
          { chaveAcesso: chave, schema: "resNFe_v1.01.xsd" },
          { chaveAcesso: chave, schema: "resNFe_v1.01.xsd" },
        ],
      })
    );
    expect(alertas.map((a) => a.codigo)).toContain("nfe_duplicada");
  });

  it("não dispara para chaves diferentes", () => {
    const alertas = avaliarRegras(
      baseCtx({
        documentosFiscais: [
          { chaveAcesso: chaveComNumero("33508879000136", "001", 100), schema: "resNFe_v1.01.xsd" },
          { chaveAcesso: chaveComNumero("33508879000136", "001", 101), schema: "resNFe_v1.01.xsd" },
        ],
      })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("nfe_duplicada");
  });

  it("ignora documentos sem chave de acesso", () => {
    const alertas = avaliarRegras(
      baseCtx({ documentosFiscais: [{ chaveAcesso: null, schema: "resNFe_v1.01.xsd" }] })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("nfe_duplicada");
  });
});

describe("nfe_com_cancelamento", () => {
  it("dispara quando o schema indica evento de cancelamento", () => {
    const alertas = avaliarRegras(
      baseCtx({ documentosFiscais: [{ chaveAcesso: null, schema: "procEventoNFe_v1.00_procCancNFe.xsd" }] })
    );
    expect(alertas.map((a) => a.codigo)).toContain("nfe_com_cancelamento");
  });

  it("não dispara para uma nota normal (resNFe)", () => {
    const alertas = avaliarRegras(
      baseCtx({ documentosFiscais: [{ chaveAcesso: null, schema: "resNFe_v1.01.xsd" }] })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("nfe_com_cancelamento");
  });
});

describe("quebra_sequencia_numeracao", () => {
  it("dispara quando falta um número no meio da sequência própria", () => {
    const cnpj = "33508879000136";
    const alertas = avaliarRegras(
      baseCtx({
        empresa: { regime_tributario: "Lucro Presumido", honorario_mensal: 500, cnpj },
        documentosFiscais: [
          { chaveAcesso: chaveComNumero(cnpj, "001", 100), schema: "resNFe_v1.01.xsd" },
          { chaveAcesso: chaveComNumero(cnpj, "001", 102), schema: "resNFe_v1.01.xsd" },
        ],
      })
    );
    expect(alertas.map((a) => a.codigo)).toContain("quebra_sequencia_numeracao");
  });

  it("não dispara para sequência completa", () => {
    const cnpj = "33508879000136";
    const alertas = avaliarRegras(
      baseCtx({
        empresa: { regime_tributario: "Lucro Presumido", honorario_mensal: 500, cnpj },
        documentosFiscais: [
          { chaveAcesso: chaveComNumero(cnpj, "001", 100), schema: "resNFe_v1.01.xsd" },
          { chaveAcesso: chaveComNumero(cnpj, "001", 101), schema: "resNFe_v1.01.xsd" },
          { chaveAcesso: chaveComNumero(cnpj, "001", 102), schema: "resNFe_v1.01.xsd" },
        ],
      })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("quebra_sequencia_numeracao");
  });

  it("ignora notas recebidas de outros CNPJs (não é sequência própria)", () => {
    const alertas = avaliarRegras(
      baseCtx({
        empresa: { regime_tributario: "Lucro Presumido", honorario_mensal: 500, cnpj: "33508879000136" },
        documentosFiscais: [
          { chaveAcesso: chaveComNumero("11222333000181", "001", 100), schema: "resNFe_v1.01.xsd" },
          { chaveAcesso: chaveComNumero("11222333000181", "001", 105), schema: "resNFe_v1.01.xsd" },
        ],
      })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("quebra_sequencia_numeracao");
  });
});

function dataHaMesesAtras(meses: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

describe("ferias_vencidas", () => {
  it("dispara para funcionário ativo há mais de 24 meses sem nenhuma férias", () => {
    const alertas = avaliarRegras(
      baseCtx({
        funcionarios: [{ nome: "Maria", status: "ativo", dataAdmissao: dataHaMesesAtras(30), temFerias: false }],
      })
    );
    expect(alertas.map((a) => a.codigo)).toContain("ferias_vencidas");
  });

  it("não dispara se já tirou férias alguma vez", () => {
    const alertas = avaliarRegras(
      baseCtx({
        funcionarios: [{ nome: "Maria", status: "ativo", dataAdmissao: dataHaMesesAtras(30), temFerias: true }],
      })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("ferias_vencidas");
  });

  it("não dispara para admissão recente (menos de 24 meses)", () => {
    const alertas = avaliarRegras(
      baseCtx({
        funcionarios: [{ nome: "Maria", status: "ativo", dataAdmissao: dataHaMesesAtras(10), temFerias: false }],
      })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("ferias_vencidas");
  });

  it("não dispara para funcionário demitido", () => {
    const alertas = avaliarRegras(
      baseCtx({
        funcionarios: [{ nome: "Maria", status: "demitido", dataAdmissao: dataHaMesesAtras(30), temFerias: false }],
      })
    );
    expect(alertas.map((a) => a.codigo)).not.toContain("ferias_vencidas");
  });
});
