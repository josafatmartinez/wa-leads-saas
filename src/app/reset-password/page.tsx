import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
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
            <p className="section-kicker">Seguridad</p>
            <h1 className="section-title">Actualiza tu contraseña</h1>
            <p className="section-description">
              Define una nueva contraseña para continuar con tu sesión.
            </p>
          </div>

          <ResetPasswordForm />
        </section>

        <aside className="auth-hero hidden lg:flex">
          <span className="auth-badge">Acceso protegido</span>
          <p className="mt-6 text-2xl font-semibold leading-9">
            Refuerza la seguridad de tu cuenta y vuelve al dashboard sin perder contexto.
          </p>
          <ul className="auth-list mt-6">
            <li>Recomendado: 8+ caracteres</li>
            <li>Usa una clave única para tu workspace</li>
            <li>Actualización inmediata al guardar</li>
          </ul>
          <p className="mt-6 text-sm text-white/80">WA Leads SaaS</p>
        </aside>
      </div>
    </div>
  );
}
