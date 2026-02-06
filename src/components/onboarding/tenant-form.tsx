"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TenantFormProps = {
  initialName?: string;
};

export function TenantForm({ initialName = "" }: TenantFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setMessage("El nombre del negocio es requerido.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const response = await fetch("/api/tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) {
      setMessage(payload?.error || payload?.message || "No se pudo guardar el negocio.");
      setIsSaving(false);
      return;
    }

    router.push("/onboarding/whatsapp");
  };

  return (
    <form className="auth-card space-y-4" onSubmit={onSubmit}>
      <div className="field">
        <label className="text-sm font-semibold">Nombre del negocio</label>
        <input
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Mi empresa"
          required
        />
      </div>

      {message ? <p className="text-sm text-red-600">{message}</p> : null}

      <button className="btn btn--primary w-full" disabled={isSaving} type="submit">
        {isSaving ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
