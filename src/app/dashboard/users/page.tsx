function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("es-MX");
}

const MOCK_USER = {
  id: "user-123",
  email: "user@company.com",
  phone: "+52 55 0000 0000",
  role: "owner",
  created_at: "2024-09-10T16:00:00.000Z",
  last_sign_in_at: "2024-10-01T08:15:00.000Z",
  email_confirmed_at: "2024-09-10T16:10:00.000Z",
  phone_confirmed_at: null,
  app_metadata: { provider: "email" },
  user_metadata: { name: "Default User" },
  identities: [{ provider: "email", created_at: "2024-09-10T16:00:00.000Z" }],
};

export default function UsersPage() {
  const user = MOCK_USER;

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
