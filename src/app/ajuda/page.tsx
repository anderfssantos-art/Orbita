import Link from "next/link";

const secoes = [
  {
    titulo: "Primeiros passos",
    perguntas: [
      {
        q: "Por onde eu começo?",
        a: "Cadastre sua primeira empresa em Empresas, adicione um serviço no Catálogo de serviços, contrate esse serviço para a empresa e abra a competência do mês. Isso gera automaticamente as tarefas e os documentos esperados.",
      },
      {
        q: "O que é uma competência?",
        a: "É o ciclo mensal de trabalho de uma empresa (ex: agosto/2026). Cada competência tem suas próprias tarefas, documentos e pendências, gerados a partir dos serviços contratados por aquela empresa.",
      },
    ],
  },
  {
    titulo: "Documentos",
    perguntas: [
      {
        q: "Qual a diferença entre a Caixa de entrada e os Documentos esperados?",
        a: "Documentos esperados são pedidos específicos gerados pela competência (ex: \"XML de entrada\"), que o cliente ou a equipe preenchem um a um. A Caixa de entrada é para subir vários arquivos de uma vez sem precisar que já exista um pedido — depois é só vincular cada um ao documento certo.",
      },
      {
        q: "Como funciona a busca automática de XML?",
        a: "Em Certificado digital (A1), envie o arquivo .pfx e a senha da empresa (ficam guardados criptografados, nunca em texto simples). Depois use Buscar XML para consultar automaticamente a Receita Federal e trazer as notas fiscais pendentes de download.",
      },
    ],
  },
  {
    titulo: "Revisão e fechamento",
    perguntas: [
      {
        q: "O que é a revisão em 4 olhos?",
        a: "Serviços críticos podem exigir que uma pessoa diferente de quem concluiu a tarefa a aprove antes do fechamento. Se você trabalha sozinho, desative essa exigência no Catálogo de serviços (coluna \"Revisão 4 olhos\").",
      },
      {
        q: "Por que não consigo fechar a competência?",
        a: "O fechamento é bloqueado por qualquer pendência aberta ou tarefa crítica sem aprovação. Rode a pré-conferência para ver o que falta, resolva as pendências, e confirme que as tarefas críticas foram aprovadas (ou desative a exigência de 4 olhos).",
      },
      {
        q: "Qual a diferença entre pré-conferência e auditoria?",
        a: "Pré-conferência olha só os documentos esperados que ainda estão faltando e cria uma pendência para cada um. Auditoria aplica regras de conformidade mais amplas (ex: regime tributário incompatível com um serviço contratado, competência atrasada, tarefa crítica sem responsável).",
      },
    ],
  },
  {
    titulo: "Portal do cliente",
    perguntas: [
      {
        q: "Como o cliente acessa o Órbita?",
        a: "Na tela da empresa, gere um convite de uso único em Portal do cliente. Envie o link para o responsável da empresa — ele cria a própria conta e só enxerga os dados daquela empresa.",
      },
    ],
  },
  {
    titulo: "Planos",
    perguntas: [
      {
        q: "O que acontece se eu passar do limite de empresas do meu plano?",
        a: "O cadastro (manual ou por importação de planilha) é bloqueado com uma mensagem pedindo upgrade. Fale com a gente para mudar de plano.",
      },
    ],
  },
];

export default function AjudaPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div>
        <Link href="/dashboard" className="text-sm text-emerald-700">
          ← Painel
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Central de ajuda</h1>
        <p className="mt-1 text-sm text-zinc-600">Respostas rápidas para as dúvidas mais comuns do dia a dia.</p>
      </div>

      {secoes.map((secao) => (
        <section key={secao.titulo} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{secao.titulo}</h2>
          <div className="flex flex-col gap-2">
            {secao.perguntas.map((p) => (
              <details key={p.q} className="rounded-xl border border-zinc-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-medium text-zinc-900">{p.q}</summary>
                <p className="mt-2 text-sm text-zinc-600">{p.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
