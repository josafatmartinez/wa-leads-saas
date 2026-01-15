import Link from "next/link";

export default function Home() {
  return (
    <div className="page">
      <div className="page__content">
        <div className="card">
          <p className="text-xs uppercase tracking-[0.4em] muted">WA Leads</p>
          <h1 className="mt-2 text-3xl font-semibold">Dashboard interno</h1>
          <p className="mt-2 text-sm muted">
            Administra leads de WhatsApp y cierra ventas manualmente.
          </p>
          <Link className="btn btn--primary mt-6 inline-flex" href="/login">
            Ir a login
          </Link>
        </div>
      </div>
    </div>
  );
}
