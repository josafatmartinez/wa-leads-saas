"use client";

import { useEffect, useMemo, useState } from "react";
import type { TenantInvitation } from "@/lib/types/dashboard";

type InvitationsResponse = {
  ok: boolean;
  invitations?: TenantInvitation[];
  error?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("es-MX");
}

export function InvitationsManager() {
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRevokingId, setIsRevokingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TenantInvitation["role"]>("agent");
  const [expiresInHours, setExpiresInHours] = useState("72");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const tenantId = useMemo(() => invitations[0]?.tenant_id || "N/A", [invitations]);

  async function loadInvitations() {
    setIsLoading(true);
    const response = await fetch("/api/tenant/invitations", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as InvitationsResponse;

    if (!response.ok || !payload.ok) {
      setInvitations([]);
      setMessageType("error");
      setMessage(payload.error || "No se pudieron cargar las invitaciones.");
      setIsLoading(false);
      return;
    }

    setInvitations(payload.invitations || []);
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/tenant/invitations", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as InvitationsResponse;
        if (cancelled) return;

        if (!response.ok || !payload.ok) {
          setInvitations([]);
          setMessageType("error");
          setMessage(payload.error || "No se pudieron cargar las invitaciones.");
          setIsLoading(false);
          return;
        }

        setInvitations(payload.invitations || []);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setInvitations([]);
        setMessageType("error");
        setMessage("No se pudieron cargar las invitaciones.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setMessageType("error");
      setMessage("El correo es requerido.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setLastInviteLink(null);

    const response = await fetch("/api/tenant/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        role,
        expiresInHours: Number(expiresInHours),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      inviteToken?: string | null;
    };

    if (!response.ok || !payload.ok) {
      setMessageType("error");
      setMessage(payload.error || "No se pudo crear la invitación.");
      setIsSaving(false);
      return;
    }

    setMessageType("success");
    setMessage("Invitación creada correctamente.");
    const inviteToken = payload.inviteToken || null;
    if (inviteToken && typeof window !== "undefined") {
      setLastInviteLink(`${window.location.origin}/invite/${inviteToken}`);
    }
    setEmail("");
    setRole("agent");
    setExpiresInHours("72");
    await loadInvitations();
    setIsSaving(false);
  }

  async function handleRevokeInvitation(invitationId: string) {
    setIsRevokingId(invitationId);
    setMessage(null);

    const response = await fetch(`/api/tenant/invitations/${encodeURIComponent(invitationId)}`, {
      method: "DELETE",
    });
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setMessageType("error");
      setMessage(payload.error || "No se pudo revocar la invitación.");
      setIsRevokingId(null);
      return;
    }

    setMessageType("success");
    setMessage("Invitación revocada.");
    await loadInvitations();
    setIsRevokingId(null);
  }

  async function handleCopyLastInvite() {
    if (!lastInviteLink) return;
    await navigator.clipboard.writeText(lastInviteLink);
    setMessageType("success");
    setMessage("Enlace copiado al portapapeles.");
  }

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="section-kicker">Invitaciones</p>
          <h2 className="section-title">Accesos por correo</h2>
          <p className="section-description">
            Crea invitaciones para agentes o viewers. El enlace permite aceptar acceso al tenant.
          </p>
        </div>
        <div className="section-actions">
          <span className="pill">Tenant: {tenantId}</span>
        </div>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleCreateInvitation}>
        <div className="grid grid--3">
          <div className="field">
            <label className="text-sm font-semibold">Correo</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="agente@empresa.com"
              required
            />
          </div>
          <div className="field">
            <label className="text-sm font-semibold">Rol</label>
            <select
              className="select"
              value={role}
              onChange={(event) => setRole(event.target.value as TenantInvitation["role"])}
            >
              <option value="agent">agent</option>
              <option value="viewer">viewer</option>
              <option value="tenant_admin">tenant_admin</option>
            </select>
          </div>
          <div className="field">
            <label className="text-sm font-semibold">Expira (horas)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={336}
              value={expiresInHours}
              onChange={(event) => setExpiresInHours(event.target.value)}
              required
            />
          </div>
        </div>

        <button className="btn btn--primary w-fit" type="submit" disabled={isSaving}>
          {isSaving ? "Creando invitación..." : "Crear invitación"}
        </button>
      </form>

      {lastInviteLink ? (
        <div className="card--subtle mt-4">
          <p className="section-kicker">Último enlace generado</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="text-xs">{lastInviteLink}</code>
            <button className="btn btn--ghost" type="button" onClick={handleCopyLastInvite}>
              Copiar enlace
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className={`auth-alert mt-4 ${messageType === "error" ? "auth-alert--error" : "auth-alert--success"}`}>
          {message}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        {isLoading ? (
          <p className="text-sm muted">Cargando invitaciones...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Status</th>
                <th>Expira</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {invitations.length === 0 ? (
                <tr>
                  <td className="muted text-sm" colSpan={5}>
                    No hay invitaciones registradas.
                  </td>
                </tr>
              ) : (
                invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="text-sm font-semibold">{invitation.email}</td>
                    <td>
                      <span className="badge badge--lavender">{invitation.role}</span>
                    </td>
                    <td className="text-sm">{invitation.status}</td>
                    <td className="muted text-sm">{formatDate(invitation.expires_at)}</td>
                    <td>
                      {invitation.status === "pending" ? (
                        <button
                          className="btn btn--ghost"
                          type="button"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          disabled={isRevokingId === invitation.id}
                        >
                          {isRevokingId === invitation.id ? "Revocando..." : "Revocar"}
                        </button>
                      ) : (
                        <span className="muted text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
