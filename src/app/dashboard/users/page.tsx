import { fetchSessionData } from "@/lib/server-api";

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
    <section className="card">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] muted">Usuario</p>
        <h1 className="mt-2 text-2xl font-semibold">Información de cuenta</h1>
        <p className="mt-2 text-sm muted">
          Datos disponibles del usuario autenticado.
        </p>
      </div>

      {!user ? (
        <p className="mt-6 text-sm muted">No hay sesión activa.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">ID</p>
            <p className="mt-2 text-sm font-semibold">{user.id}</p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Email</p>
            <p className="mt-2 text-sm font-semibold">{user.email ?? "N/A"}</p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Teléfono</p>
            <p className="mt-2 text-sm font-semibold">{user.phone ?? "N/A"}</p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Rol</p>
            <p className="mt-2 text-sm font-semibold">{user.role ?? "N/A"}</p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Creado</p>
            <p className="mt-2 text-sm font-semibold">{formatDate(user.created_at)}</p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Último acceso</p>
            <p className="mt-2 text-sm font-semibold">
              {formatDate(user.last_sign_in_at)}
            </p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Email confirmado</p>
            <p className="mt-2 text-sm font-semibold">
              {formatDate(user.email_confirmed_at)}
            </p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Teléfono confirmado</p>
            <p className="mt-2 text-sm font-semibold">
              {formatDate(user.phone_confirmed_at)}
            </p>
          </div>
          <div className="card--subtle md:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] muted">App metadata</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-[#4b4b4b]">
              {JSON.stringify(user.app_metadata ?? {}, null, 2)}
            </pre>
          </div>
          <div className="card--subtle md:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] muted">User metadata</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-[#4b4b4b]">
              {JSON.stringify(user.user_metadata ?? {}, null, 2)}
            </pre>
          </div>
          <div className="card--subtle md:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] muted">Identities</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-[#4b4b4b]">
              {JSON.stringify(user.identities ?? [], null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
