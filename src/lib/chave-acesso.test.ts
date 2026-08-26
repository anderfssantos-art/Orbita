import { describe, it, expect } from "vitest";
import { decodificarChaveAcesso } from "./chave-acesso";

describe("decodificarChaveAcesso", () => {
  it("decodifica uma chave válida de 44 dígitos", () => {
    // cUF=35, AAMM=2608, CNPJ=33508879000136, mod=55, serie=001, numero=000012345, tpEmis=1, cNF=12345678, cDV=9
    const chave = "35260833508879000136550010000123451123456789";
    const decodificada = decodificarChaveAcesso(chave);
    expect(decodificada).toEqual({
      cUF: "35",
      anoMes: "2608",
      cnpj: "33508879000136",
      modelo: "55",
      serie: "001",
      numero: 12345,
      tpEmis: "1",
    });
  });

  it("devolve null para chave com menos de 44 dígitos", () => {
    expect(decodificarChaveAcesso("123")).toBeNull();
  });

  it("devolve null para chave com caracteres não numéricos", () => {
    expect(decodificarChaveAcesso("3526083350887900013655001000012345112345678X")).toBeNull();
  });
});
