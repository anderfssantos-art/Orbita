/**
 * Parser de CSV que respeita campos entre aspas — sem isso, uma razão
 * social real com vírgula (comum em nomes de empresas brasileiras) quebra
 * o mapeamento de colunas ao dividir ingenuamente por vírgula.
 */
export function parseCsvLine(line: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (dentroDeAspas) {
      if (char === '"' && line[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (char === '"') {
        dentroDeAspas = false;
      } else {
        atual += char;
      }
    } else if (char === '"') {
      dentroDeAspas = true;
    } else if (char === ",") {
      campos.push(atual.trim());
      atual = "";
    } else {
      atual += char;
    }
  }

  campos.push(atual.trim());
  return campos;
}
