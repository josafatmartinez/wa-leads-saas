"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type InviteAcceptCardProps = {
  token: string;
};

export function InviteAcceptCard({ token }: InviteAcceptCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const redirectTo = useMemo(() => `/invite/${encodeURIComponent(token)}`, [token]);

  async function handleAccept() {
    setIsLoading(true);
    setStatus("idle");
    setMessage(null);

    const response = await fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, {
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setStatus("error");
      setMessage(payload.error || "No se pudo aceptar la invitación.");
      setIsLoading(false);
      return;
    }

    setStatus("success");
    setMessage("Invitación aceptada. Te estamos redirigiendo al dashboard.");
    router.push("/dashboard/leads");
  }

  return (
    <div className="auth-card">
      <p className="section-kicker">Invitación</p>
      <h1 className="section-title mt-2">Aceptar acceso al tenant</h1>
      <p className="section-description mt-2">
        Inicia sesión con el correo invitado y confirma el acceso al negocio.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn btn--primary" type="button" onClick={handleAccept} disabled={isLoading}>
          {isLoading ? "Validando invitación..." : "Aceptar invitación"}
        </button>
        <Link className="btn btn--ghost" href={`/login?redirect=${encodeURIComponent(redirectTo)}`}>
          Ir a login
        </Link>
        <Link className="btn btn--ghost" href={`/signup?redirect=${encodeURIComponent(redirectTo)}`}>
          Crear cuenta
        </Link>
      </div>

      {status === "error" && message ? (
        <p className="auth-alert auth-alert--error mt-4" role="alert">
          {message}
        </p>
      ) : null}
      {status === "success" && message ? (
        <p className="auth-alert auth-alert--success mt-4" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
