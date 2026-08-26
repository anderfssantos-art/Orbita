/**
 * Cliente para o webservice NFeDistribuicaoDFe da Receita Federal.
 *
 * A autenticação é feita só pelo certificado apresentado no handshake TLS
 * (mTLS) — o XML da requisição (distDFeInt) NÃO é assinado com XML-DSig,
 * diferente de outros serviços de NFe. Assinar essa mensagem faz a Receita
 * rejeitar com cStat 215 ("Falha no esquema xml"), pois o schema não prevê
 * um elemento Signature dentro de distDFeInt.
 */
import https from "node:https";
import forge from "node-forge";

// Ambiente de homologação por padrão — nunca produção sem validação prévia.
// O endereço antigo (hom.nfe.fazenda.gov.br) foi descontinuado pela Receita
// em 2022; "hom1" é o atual.
const ENDPOINT_HOMOLOGACAO = "hom1.nfe.fazenda.gov.br";
const PATH_SERVICO = "/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx";

type ChavesExtraidas = {
  certPem: string;
  chavePem: string;
};

function extrairChavesPem(pfxBuffer: Buffer, senha: string): ChavesExtraidas {
  const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer.toString("binary")));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

  let certPem: string | null = null;
  let chavePem: string | null = null;

  for (const safeContents of p12.safeContents) {
    for (const safeBag of safeContents.safeBags) {
      if (safeBag.cert) {
        certPem = forge.pki.certificateToPem(safeBag.cert);
      }
      if (safeBag.key) {
        chavePem = forge.pki.privateKeyToPem(safeBag.key);
      }
    }
  }

  if (!certPem || !chavePem) {
    throw new Error("Não foi possível extrair certificado e chave privada do arquivo.");
  }

  return { certPem, chavePem };
}

function montarXmlDistribuicao(cnpj: string, ultimoNsu: string, cUF: string): string {
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  return (
    `<distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.35">` +
    `<tpAmb>2</tpAmb>` + // 2 = homologação
    `<cUFAutor>${cUF}</cUFAutor>` +
    `<CNPJ>${cnpjLimpo}</CNPJ>` +
    `<distNSU><ultNSU>${ultimoNsu}</ultNSU></distNSU>` +
    `</distDFeInt>`
  );
}

function montarEnvelopeSoap(xmlAssinado: string): string {
  return (
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">` +
    `<soap12:Body>` +
    `<nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">` +
    `<nfeDadosMsg>${xmlAssinado}</nfeDadosMsg>` +
    `</nfeDistDFeInteresse>` +
    `</soap12:Body>` +
    `</soap12:Envelope>`
  );
}

export type ResultadoBuscaXml = {
  sucesso: boolean;
  respostaBruta: string;
  erro?: string;
  xmlEnviado?: string; // temporário, só para depurar o cStat 215 com dado real
};

/**
 * Busca documentos fiscais pendentes de distribuição para o CNPJ informado.
 * cUF: código IBGE da UF do certificado (ex: "35" para SP, "33" para RJ).
 */
export async function buscarDocumentosFiscais(
  arquivoBase64: string,
  senha: string,
  cnpj: string,
  ultimoNsu: string,
  cUF: string
): Promise<ResultadoBuscaXml> {
  const pfxBuffer = Buffer.from(arquivoBase64, "base64");

  try {
    extrairChavesPem(pfxBuffer, senha); // valida que o arquivo/senha abrem antes de gastar uma chamada de rede
  } catch (e) {
    return {
      sucesso: false,
      respostaBruta: "",
      erro: "Não foi possível abrir o certificado: " + (e as Error).message,
    };
  }

  const xml = montarXmlDistribuicao(cnpj, ultimoNsu, cUF);
  const envelope = montarEnvelopeSoap(xml);

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: ENDPOINT_HOMOLOGACAO,
        path: PATH_SERVICO,
        method: "POST",
        pfx: pfxBuffer,
        passphrase: senha,
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
          "Content-Length": Buffer.byteLength(envelope),
        },
        timeout: 20000,
      },
      (res) => {
        let corpo = "";
        res.on("data", (chunk) => (corpo += chunk));
        res.on("end", () => {
          resolve({
            sucesso: (res.statusCode ?? 500) < 300,
            respostaBruta: corpo,
            erro: (res.statusCode ?? 500) >= 300 ? `HTTP ${res.statusCode}` : undefined,
            xmlEnviado: xml,
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ sucesso: false, respostaBruta: "", erro: "Tempo esgotado ao contatar a Receita." });
    });

    req.on("error", (e) => {
      resolve({ sucesso: false, respostaBruta: "", erro: "Erro de conexão: " + e.message });
    });

    req.write(envelope);
    req.end();
  });
}
