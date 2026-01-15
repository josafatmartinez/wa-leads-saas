# Codex – instrucciones rápidas

- Proyecto: Next.js (App Router) con TypeScript y Tailwind CSS v4; usa React 19.
- Usa `npm` (lockfile existente). Comandos útiles: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- Node 20+ recomendado.
- Estilo: mantener ASCII, comentarios solo si aportan claridad, respetar patrones de Tailwind. No introducir dependencias sin necesidad.
- Para UI: seguir el App Router (`src/app`), evita borrar configuraciones base de Next/Tailwind.
- Supabase utils en `src/utils/supabase/*`: `client.ts` (getSupabaseClient cacheado), `server.ts` (getServerSupabaseClient con cookies), `middleware.ts` (getMiddlewareSupabaseClient). Proxy ya configurado en `src/proxy.ts` usando `supabase.auth.getSession()` y protegiendo rutas (públicas: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/hash`, `/auth/error`, `/api/public`). Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver `.env.example`). Compat en `src/lib/supabaseClient.ts`.
- Tests: Vitest configurado en `vitest.config.ts` (pool `threads`), comando `npm test`.
