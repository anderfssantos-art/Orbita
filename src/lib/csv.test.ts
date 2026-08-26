import { describe, it, expect } from "vitest";
import { parseCsvLine } from "./csv";

describe("parseCsvLine", () => {
  it("separa campos simples por vírgula", () => {
    expect(parseCsvLine("12345678000199,Empresa Teste,Simples Nacional")).toEqual([
      "12345678000199",
      "Empresa Teste",
      "Simples Nacional",
    ]);
  });

  it("preserva vírgula dentro de campo entre aspas", () => {
    expect(parseCsvLine('12345678000199,"Empresa Teste, Filial SP",Simples Nacional')).toEqual([
      "12345678000199",
      "Empresa Teste, Filial SP",
      "Simples Nacional",
    ]);
  });

  it("trata aspas duplas escapadas dentro do campo", () => {
    expect(parseCsvLine('1,"Nome com ""apelido""",2')).toEqual(["1", 'Nome com "apelido"', "2"]);
  });

  it("remove espaços nas bordas de cada campo", () => {
    expect(parseCsvLine("  a  ,  b  ,  c  ")).toEqual(["a", "b", "c"]);
  });

  it("devolve um único campo para linha sem vírgula", () => {
    expect(parseCsvLine("valor-unico")).toEqual(["valor-unico"]);
  });
});
