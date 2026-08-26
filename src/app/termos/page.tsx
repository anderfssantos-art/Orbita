import Link from "next/link";

export default function TermosPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <Link href="/dashboard" className="text-sm text-emerald-700">
          ← Painel
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Termos de uso</h1>
        <p className="mt-1 text-xs text-amber-700">
          ⚠ Minuta inicial — não publicada oficialmente. Precisa de revisão de um advogado antes de valer como termo real.
        </p>
      </div>

      <section className="flex flex-col gap-4 text-sm leading-relaxed text-zinc-700">
        <p>Última atualização: 26 de agosto de 2026.</p>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">1. O que é o Órbita</h2>
          <p>
            Órbita é uma plataforma de operação para escritórios de contabilidade, usada para organizar o fluxo
            mensal de trabalho com empresas clientes: coleta de documentos, tarefas, prazos e comunicação.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">2. Quem pode usar</h2>
          <p>
            O escritório contratante (&quot;Cliente&quot;) e as pessoas que ele autorizar — colaboradores internos e
            responsáveis pelas empresas atendidas, através do portal do cliente. Cada conta é pessoal e
            intransferível.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">3. Responsabilidade pelos dados enviados</h2>
          <p>
            O Cliente é responsável pela exatidão dos dados e documentos que insere na plataforma. O Órbita
            armazena e organiza essas informações, mas não substitui a análise técnica e o julgamento profissional
            do contador — inclusive os alertas automáticos de auditoria são apoio à decisão, não parecer contábil
            ou tributário.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">4. Certificados digitais</h2>
          <p>
            Certificados digitais (A1) enviados pelo Cliente são armazenados de forma criptografada e usados
            exclusivamente para consultas automatizadas que o próprio Cliente configurar (ex: busca de documentos
            fiscais). O Cliente pode remover um certificado a qualquer momento, o que apaga também os dados
            criptografados associados.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">5. Planos e limites</h2>
          <p>
            O acesso é organizado em planos com limites de uso (ex: número de empresas). Ultrapassar o limite do
            plano atual bloqueia novos cadastros até upgrade ou remoção de empresas existentes.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">6. Disponibilidade</h2>
          <p>
            Fazemos esforço razoável para manter o serviço disponível, mas não garantimos operação ininterrupta.
            Manutenções e eventuais indisponibilidades serão comunicadas quando possível.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">7. Cancelamento</h2>
          <p>
            O Cliente pode encerrar o uso a qualquer momento. Os dados ficam disponíveis para exportação por um
            período razoável após o cancelamento, findo o qual poderão ser excluídos.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">8. Alterações</h2>
          <p>Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas com antecedência razoável.</p>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Veja também a{" "}
          <Link href="/privacidade" className="text-emerald-700 hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
