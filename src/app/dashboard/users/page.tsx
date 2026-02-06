import { fetchSessionData } from "@/lib/server-api";
import { MembersManager } from "@/components/users/members-manager";
import { InvitationsManager } from "@/components/users/invitations-manager";

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("es-MX");
}

export default async function UsersPage() {
  let user = null;

  try {
    const session = await fetchSessionData();
    if (session.ok) {
      user = session.user;
    }
  } catch {
    user = null;
  }

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-kicker">Usuario</p>
            <h1 className="section-title">Información de cuenta</h1>
            <p className="section-description">Datos disponibles del usuario autenticado.</p>
          </div>
        </div>

        {!user ? (
          <p className="mt-6 text-sm muted">No hay sesión activa.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="card--subtle">
              <p className="section-kicker">ID</p>
              <p className="mt-2 text-sm font-semibold">{user.id}</p>
            </div>
            <div className="card--subtle">
              <p className="section-kicker">Email</p>
              <p className="mt-2 text-sm font-semibold">{user.email ?? "N/A"}</p>
            </div>
            <div className="card--subtle">
              <p className="section-kicker">Teléfono</p>
              <p className="mt-2 text-sm font-semibold">{user.phone ?? "N/A"}</p>
            </div>
            <div className="card--subtle">
              <p className="section-kicker">Rol</p>
              <p className="mt-2 text-sm font-semibold">{user.role ?? "N/A"}</p>
            </div>
            <div className="card--subtle">
              <p className="section-kicker">Creado</p>
              <p className="mt-2 text-sm font-semibold">{formatDate(user.created_at)}</p>
            </div>
            <div className="card--subtle">
              <p className="section-kicker">Último acceso</p>
              <p className="mt-2 text-sm font-semibold">{formatDate(user.last_sign_in_at)}</p>
            </div>
          </div>
        )}
      </section>

      <MembersManager />
      <InvitationsManager />
    </div>
  );
}
