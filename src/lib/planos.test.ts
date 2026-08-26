import { describe, it, expect } from "vitest";
import { planoDe } from "./planos";

describe("planoDe", () => {
  it("devolve o plano correto para um código conhecido", () => {
    expect(planoDe("solo").nome).toBe("Solo");
    expect(planoDe("solo").limiteEmpresas).toBe(15);
  });

  it("cai para trial quando o código não existe", () => {
    expect(planoDe("plano-inexistente").codigo).toBe("trial");
  });

  it("plano escritorio não tem limite de empresas", () => {
    expect(planoDe("escritorio").limiteEmpresas).toBeNull();
  });
});
