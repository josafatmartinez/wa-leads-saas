import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    redirect?: string | string[];
  }>;
};

function getRedirectValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] || "/dashboard/leads";
  return value || "/dashboard/leads";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo = getRedirectValue(resolvedSearchParams?.redirect);

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="auth-panel">
          <div className="auth-brand">
            <span className="auth-brand__dot" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              WA Leads
            </p>
          </div>

          <div>
            <p className="section-kicker">Bienvenido</p>
            <h1 className="section-title">Inicia sesión</h1>
            <p className="section-description">
              Accede al pipeline comercial y prioriza leads en minutos.
            </p>
          </div>

          <LoginForm redirectTo={redirectTo} />
        </section>

        <aside className="auth-hero hidden lg:flex">
          <span className="auth-badge">Seguimiento inteligente</span>
          <p className="mt-6 text-2xl font-semibold leading-9">
            Visualiza estado, prioridad y próxima acción de cada lead en un solo flujo.
          </p>
          <ul className="auth-list mt-6">
            <li>Alertas en tiempo real cuando llega un lead</li>
            <li>Etiquetas de prioridad listas para el equipo</li>
            <li>Notas internas sincronizadas con ventas</li>
          </ul>
          <p className="mt-6 text-sm text-white/80">Equipo de Ventas, Tenant Default</p>
        </aside>
      </div>
    </div>
  );
}
