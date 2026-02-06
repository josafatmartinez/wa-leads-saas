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

## API-first dashboard data

El dashboard ya no consulta Supabase desde los componentes. En su lugar se comunica con un endpoint centralizado (por defecto `/api/*` en esta app) y puede apuntar a un servidor remoto durante el desarrollo agregando `NEXT_PUBLIC_WA_LEADS_API_URL=https://wa-leads-api.onrender.com` al `.env.local`. En producción o cuando esta variable está vacía se usa `NEXT_PUBLIC_APP_URL` para construir las rutas internas; en desarrollo el `server-api` detecta el override y reenvía todas las llamadas a `https://wa-leads-api.onrender.com`.

Los endpoints disponibles son:

- `POST /api/auth/login`: recibe email/contraseña, delega en Supabase y devuelve `supabase-auth-token` vía cookies
- `POST /api/auth/logout`: invalida la sesión (llama a `supabase.auth.signOut`)
- `GET /api/auth/session`: obtiene el usuario autenticado (usa `supabase.auth.getUser`)
- `GET /api/dashboard/leads`: devuelve los últimos leads del tenant `default`
- `GET /api/dashboard/leads/[slug]`: devuelve detalles del lead identificado por `slug`
- `PATCH /api/dashboard/leads/[slug]`: actualiza el `status` y las `notes` internas
- `GET /api/dashboard/config`: lee la configuración del bot y aplica valores por defecto
- `PATCH /api/dashboard/config`: persiste `bot_enabled`, `welcome_text` y `closing_text`

El helper `src/lib/server-api.ts` provee funciones reutilizables (fetchers, actualizaciones, sesión) que incluyen las cookies actuales y devuelven los JSON de los endpoints. Está pensado para usarse desde componentes Server y App Actions.

### Invitaciones y reset

Supabase redirige las invitaciones con el `access_token` en el hash (`/#access_token=...`). El cliente ahora expone `/auth/hash`, que captura ese hash, llama a `POST /api/auth/session` para crear la sesión en el servidor y redirige automáticamente a `/reset-password`, la pantalla donde el usuario actualiza su contraseña vía `POST /api/auth/password`.

El middleware `/src/proxy.ts` aún refresca la sesión con Supabase y protege `/dashboard` (p. ej. redirige a `/login` si no hay `session`) para que la zona privada sólo se renderice cuando hay una sesión activa.

### Auth UI

- Páginas disponibles: `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- El login del cliente sigue enviando credenciales a `/api/auth/login`, que propaga cookies `supabase-auth-token` y `supabase-auth-refresh-token`.
- El signup se sigue manejando con la integración existente de Supabase (requiere que las rutas de autenticación definan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` junto con las llaves de servicio).

## Testing

- Ejecuta `npm test` (Vitest) para correr la suite. Configuración en `vitest.config.ts` con `pool: "threads"` para evitar fallos de workers en Node recientes.
- Flujo E2E de onboarding + invitación: `npm run test:e2e`.
  Requiere app corriendo en `E2E_BASE_URL` (por defecto `http://127.0.0.1:3000`) y backend/API accesible.
  Variables opcionales: `E2E_BASE_URL`, `E2E_PASSWORD`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
