"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success" }
  | { type: "error"; message: string };

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setStatus({ type: "error", message: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }

    if (password !== confirm) {
      setStatus({ type: "error", message: "Las contraseñas no coinciden." });
      return;
    }

    setStatus({ type: "loading" });
    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setStatus({
        type: "error",
        message: payload.error || "No se pudo actualizar la contraseña.",
      });
      return;
    }

    setStatus({ type: "success" });
    router.replace("/dashboard/leads");
  };

  return (
    <div className="auth-card">
      {status.type === "loading" && <Alert>Actualizando contraseña...</Alert>}
      {status.type === "error" && <Alert variant="destructive">{status.message}</Alert>}
      {status.type === "success" && (
        <Alert variant="success">Contraseña actualizada. Redirigiendo...</Alert>
      )}

      <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
        <div className="field">
          <label className="text-sm font-semibold">Nueva contraseña</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="field">
          <label className="text-sm font-semibold">Confirma la contraseña</label>
          <input
            className="input"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <button className="btn btn--primary w-full" type="submit" disabled={status.type === "loading"}>
          {status.type === "loading" ? "Actualizando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
