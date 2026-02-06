import { SignupForm } from "@/components/auth/signup-form";

type SignupPageProps = {
  searchParams?: Promise<{
    redirect?: string | string[];
  }>;
};

function getRedirectValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] || "/dashboard/leads";
  return value || "/dashboard/leads";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
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
            <p className="section-kicker">Nuevo acceso</p>
            <h1 className="section-title">Crea tu cuenta</h1>
            <p className="section-description">
              Configura tu acceso y entra al dashboard comercial en minutos.
            </p>
          </div>

          <SignupForm redirectTo={redirectTo} />
        </section>

        <aside className="auth-hero hidden lg:flex">
          <span className="auth-badge">Activación rápida</span>
          <p className="mt-6 text-2xl font-semibold leading-9">
            Crea tu usuario y empieza a gestionar conversaciones de WhatsApp desde el primer día.
          </p>
          <ul className="auth-list mt-6">
            <li>Pipeline listo para tu equipo comercial</li>
            <li>Integración con WhatsApp sin fricción</li>
            <li>Notas internas y status automatizados</li>
          </ul>
          <p className="mt-6 text-sm text-white/80">WA Leads SaaS</p>
        </aside>
      </div>
    </div>
  );
}
