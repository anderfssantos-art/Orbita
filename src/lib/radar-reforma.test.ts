import { describe, it, expect } from "vitest";
import { marcoAtual, proximoMarco } from "./radar-reforma";

describe("marcoAtual", () => {
  it("identifica a fase de testes de 2026", () => {
    expect(marcoAtual(new Date("2026-06-01")).codigo).toBe("2026_fase_teste");
  });

  it("identifica o início do CBS integral em 2027", () => {
    expect(marcoAtual(new Date("2027-03-01")).codigo).toBe("2027_cbs_integral");
  });

  it("identifica a implementação plena em 2033", () => {
    expect(marcoAtual(new Date("2035-01-01")).codigo).toBe("2033_implantacao_plena");
  });

  it("antes de 2026 cai no primeiro marco (nada anterior definido)", () => {
    expect(marcoAtual(new Date("2020-01-01")).codigo).toBe("2026_fase_teste");
  });
});

describe("proximoMarco", () => {
  it("aponta para 2027 quando estamos em 2026", () => {
    expect(proximoMarco(new Date("2026-06-01"))?.codigo).toBe("2027_cbs_integral");
  });

  it("é nulo depois do último marco (2033)", () => {
    expect(proximoMarco(new Date("2035-01-01"))).toBeNull();
  });
});
