This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase

Configuración básica para consumir Supabase desde el cliente:

- Copia `.env.example` a `.env.local` y completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Utilidades en `src/utils/supabase/*`:
  - `client.ts`: `getSupabaseClient()` (cache global en dev/hot reload).
  - `server.ts`: `getServerSupabaseClient()` listo para App Router (cookies).
  - `middleware.ts`: `getMiddlewareSupabaseClient(req)` retorna `{ supabase, response }` para usar en middleware.
- Wrapper de compatibilidad en `src/lib/supabaseClient.ts` que reexporta `getSupabaseClient`. Ejemplo:

Middleware ya integrado en `src/middleware.ts` para refrescar sesión (`supabase.auth.getSession()`) y propagar cookies. Ajusta `config.matcher` si necesitas excluir rutas.

```ts
import { getSupabaseClient } from "@/utils/supabase/client";

const supabase = getSupabaseClient();
const { data, error } = await supabase.from("table").select("*");
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
