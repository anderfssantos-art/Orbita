const checks = [
  { label: "Next.js + TypeScript", done: true },
  { label: "Esquema SQL (escritórios, empresas, competências...)", done: true },
  { label: "Políticas de Row Level Security", done: true },
  { label: "Cliente Supabase (browser + servidor)", done: true },
  { label: "Projeto Supabase conectado (.env.local)", done: true },
  { label: "Migrações aplicadas no banco", done: true },
  { label: "Isolamento entre escritórios testado e comprovado", done: true },
  { label: "Login funcionando", done: false },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Órbita
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
          Fundação técnica concluída
        </h1>
        <p className="mt-2 text-zinc-600">
          O isolamento de dados entre escritórios foi testado com dois
          usuários simulados — cada um só enxergou a própria empresa.
          Próximo passo: telas de login e cadastro de empresas (Fase 3).
        </p>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {checks.map((item) => (
          <li key={item.label} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span
              className={
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                (item.done
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-zinc-100 text-zinc-400")
              }
            >
              {item.done ? "✓" : "·"}
            </span>
            <span className={item.done ? "text-zinc-900" : "text-zinc-500"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
