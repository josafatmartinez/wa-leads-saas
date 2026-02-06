import { InviteAcceptCard } from "@/components/auth/invite-accept-card";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

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
          <InviteAcceptCard token={token} />
        </section>

        <aside className="auth-hero hidden lg:flex">
          <span className="auth-badge">Acceso por invitación</span>
          <p className="mt-6 text-2xl font-semibold leading-9">
            Tu tenant admin te invitó. Acepta el acceso para empezar a gestionar conversaciones.
          </p>
          <ul className="auth-list mt-6">
            <li>Acceso por roles: admin, agent o viewer</li>
            <li>Control centralizado por negocio</li>
            <li>Invitaciones seguras con expiración</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
