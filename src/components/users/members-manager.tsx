"use client";

import { useEffect, useMemo, useState } from "react";
import type { TenantMember } from "@/lib/types/dashboard";

type MembersResponse = {
  ok: boolean;
  members?: TenantMember[];
  error?: string;
};

function formatDate(value?: string) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("es-MX");
}

export function MembersManager() {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState("");
  const [role, setRole] = useState<TenantMember["role"]>("agent");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  async function loadMembers() {
    setIsLoading(true);
    setMessage(null);
    const response = await fetch("/api/tenant/members", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as MembersResponse;

    if (!response.ok || !payload.ok) {
      setMembers([]);
      setMessageType("error");
      setMessage(payload.error || "No se pudieron cargar los miembros.");
      setIsLoading(false);
      return;
    }

    setMembers(payload.members || []);
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/tenant/members", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as MembersResponse;
        if (cancelled) return;

        if (!response.ok || !payload.ok) {
          setMembers([]);
          setMessageType("error");
          setMessage(payload.error || "No se pudieron cargar los miembros.");
          setIsLoading(false);
          return;
        }

        setMembers(payload.members || []);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMembers([]);
        setMessageType("error");
        setMessage("No se pudieron cargar los miembros.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tenantId = useMemo(() => members[0]?.tenant_id || "N/A", [members]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseUserId.trim()) {
      setMessageType("error");
      setMessage("El Supabase User ID es requerido.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const response = await fetch("/api/tenant/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabaseUserId: supabaseUserId.trim(),
        role,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };

    if (!response.ok || !payload?.ok) {
      setMessageType("error");
      setMessage(payload.error || "No se pudo guardar el miembro.");
      setIsSaving(false);
      return;
    }

    setMessageType("success");
    setMessage("Miembro guardado correctamente.");
    setSupabaseUserId("");
    setRole("agent");
    await loadMembers();
    setIsSaving(false);
  }

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="section-kicker">Miembros</p>
          <h2 className="section-title">Tenant Members</h2>
          <p className="section-description">
            Como `tenant_admin` puedes agregar usuarios al negocio y asignar su rol.
          </p>
        </div>
        <div className="section-actions">
          <span className="pill">Tenant: {tenantId}</span>
        </div>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid grid--2">
          <div className="field">
            <label className="text-sm font-semibold">Supabase User ID</label>
            <input
              className="input"
              value={supabaseUserId}
              onChange={(event) => setSupabaseUserId(event.target.value)}
              placeholder="e468b699-1c0b-4017-b9e0-d7c519c076ab"
              required
            />
          </div>
          <div className="field">
            <label className="text-sm font-semibold">Rol</label>
            <select
              className="select"
              value={role}
              onChange={(event) => setRole(event.target.value as TenantMember["role"])}
            >
              <option value="tenant_admin">tenant_admin</option>
              <option value="agent">agent</option>
              <option value="viewer">viewer</option>
            </select>
          </div>
        </div>

        <button className="btn btn--primary w-fit" type="submit" disabled={isSaving}>
          {isSaving ? "Guardando miembro..." : "Agregar / actualizar miembro"}
        </button>
      </form>

      {message ? (
        <p className={`auth-alert mt-4 ${messageType === "error" ? "auth-alert--error" : "auth-alert--success"}`}>
          {message}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        {isLoading ? (
          <p className="text-sm muted">Cargando miembros...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Supabase User ID</th>
                <th>Rol</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td className="muted text-sm" colSpan={3}>
                    No hay miembros registrados todavía.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id}>
                    <td className="text-sm font-semibold">{member.supabase_user_id}</td>
                    <td>
                      <span className="badge badge--lavender">{member.role}</span>
                    </td>
                    <td className="muted text-sm">{formatDate(member.created_at)}</td>
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
