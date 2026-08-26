# Órbita

Plataforma de operação inteligente para escritórios contábeis. Ver o roteiro completo do projeto e a documentação de especificação nos artifacts publicados durante o planejamento.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Row Level Security, Auth, Storage)

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (plano gratuito serve para o MVP).
2. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
3. Copie `.env.local.example` para `.env.local` e preencha os dois valores:

   ```bash
   cp .env.local.example .env.local
   ```

4. Rode as migrações em `supabase/migrations/` na ordem numérica (001, 002, 003) — pelo SQL Editor do painel Supabase, ou via Supabase CLI (`supabase db push`).
5. Teste o isolamento antes de seguir: crie dois escritórios fake, um usuário em cada, e confirme que um não lê dados do outro pelo SQL Editor com `set role authenticated; set request.jwt.claim.sub = '<uuid-do-usuario>';`.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
  app/              rotas (App Router)
  lib/supabase/      clientes Supabase (browser e servidor)
supabase/
  migrations/        esquema SQL, em ordem, com as políticas de RLS
```
