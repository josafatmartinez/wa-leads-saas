import Link from "next/link";

export default function Home() {
  return (
    <div className="auth-shell">
      <div className="page__content">
        <div className="card">
          <p className="section-kicker">WA Leads</p>
          <h1 className="mt-2 text-3xl font-semibold">Dashboard comercial</h1>
          <p className="mt-2 text-sm muted">
            Administra leads de WhatsApp, asigna seguimiento y cierra ventas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn--primary inline-flex" href="/login">
              Iniciar sesión
            </Link>
            <Link className="btn btn--ghost inline-flex" href="/signup">
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
