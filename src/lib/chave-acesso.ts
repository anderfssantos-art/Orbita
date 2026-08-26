/**
 * Decodifica a chave de acesso de 44 dígitos de uma NF-e — estrutura fixa
 * definida pelo Manual de Orientação do Contribuinte (MOC) da NF-e:
 * cUF(2) AAMM(4) CNPJ(14) mod(2) série(3) número(9) tpEmis(1) cNF(8) cDV(1).
 */
export type ChaveAcessoDecodificada = {
  cUF: string;
  anoMes: string;
  cnpj: string;
  modelo: string;
  serie: string;
  numero: number;
  tpEmis: string;
};

export function decodificarChaveAcesso(chave: string): ChaveAcessoDecodificada | null {
  if (!/^\d{44}$/.test(chave)) return null;
  return {
    cUF: chave.slice(0, 2),
    anoMes: chave.slice(2, 6),
    cnpj: chave.slice(6, 20),
    modelo: chave.slice(20, 22),
    serie: chave.slice(22, 25),
    numero: Number(chave.slice(25, 34)),
    tpEmis: chave.slice(34, 35),
  };
}
