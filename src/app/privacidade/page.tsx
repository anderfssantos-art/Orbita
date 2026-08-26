import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <Link href="/dashboard" className="text-sm text-emerald-700">
          ← Painel
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Política de privacidade</h1>
        <p className="mt-1 text-xs text-amber-700">
          ⚠ Minuta inicial — não publicada oficialmente. Precisa de revisão jurídica (LGPD) antes de valer como
          política real, especialmente por lidar com dados fiscais de terceiros.
        </p>
      </div>

      <section className="flex flex-col gap-4 text-sm leading-relaxed text-zinc-700">
        <p>Última atualização: 26 de agosto de 2026.</p>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">1. Que dados coletamos</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Dados de cadastro: nome, e-mail, escritório vinculado.</li>
            <li>Dados das empresas atendidas: CNPJ, razão social, regime tributário, documentos fiscais e contábeis enviados.</li>
            <li>Certificados digitais (A1), armazenados de forma criptografada.</li>
            <li>Registros de uso: quem fez o quê e quando, para trilha de auditoria interna do próprio escritório.</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">2. Para que usamos</h2>
          <p>
            Só para operar a plataforma: organizar tarefas e documentos, gerar alertas de auditoria, buscar
            documentos fiscais automaticamente quando o Cliente configurar, e dar suporte técnico. Não vendemos
            nem compartilhamos esses dados com terceiros para fins de publicidade.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">3. Onde ficam armazenados</h2>
          <p>
            Em infraestrutura de nuvem (Supabase/AWS) com isolamento por escritório: um escritório nunca enxerga
            dados de outro. Certificados digitais e senhas ficam num cofre criptografado separado dos dados
            normais.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">4. Quem mais acessa esses dados</h2>
          <p>
            Dentro do escritório: os colaboradores cadastrados. Do lado do cliente: só o responsável convidado
            para aquela empresa específica enxerga os dados dela — nunca de outras empresas da carteira.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">5. Seus direitos (LGPD)</h2>
          <p>
            Qualquer titular de dados pode solicitar ao escritório contratante acesso, correção ou exclusão dos
            seus dados pessoais tratados na plataforma. O escritório, como controlador dos dados de seus clientes,
            é o responsável por atender essas solicitações; o Órbita atua como operador, dando suporte técnico
            para isso.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">6. Retenção e exclusão</h2>
          <p>
            Dados ficam armazenados enquanto a conta estiver ativa. Após cancelamento, ficam disponíveis para
            exportação por um período razoável, e depois são excluídos — exceto o que a lei exigir manter por
            prazo fiscal/contábil obrigatório.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-zinc-900">7. Contato</h2>
          <p>Dúvidas sobre esta política podem ser encaminhadas diretamente ao escritório contratante ou a nós.</p>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Veja também os{" "}
          <Link href="/termos" className="text-emerald-700 hover:underline">
            Termos de Uso
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
