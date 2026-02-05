"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = { type: "idle" } | { type: "loading" } | { type: "success" } | { type: "error"; message: string };

export default function ResetPasswordPage() {
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
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-2 sm:p-3">
        <CardHeader className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">WA Leads</p>
          <CardTitle>Actualiza tu contraseña</CardTitle>
          <CardDescription>
            Ingresa una nueva contraseña para continuar con tu sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.type === "loading" && (
            <Alert>Actualizando contraseña...</Alert>
          )}
          {status.type === "error" && <Alert variant="destructive">{status.message}</Alert>}
          {status.type === "success" && (
            <Alert variant="success">Contraseña actualizada. Redirigiendo...</Alert>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold">Nueva contraseña</label>
              <input
                className="input mt-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Confirma la contraseña</label>
              <input
                className="input mt-2"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <button className="btn btn--primary w-full" type="submit">
              {status.type === "loading" ? "Actualizando..." : "Guardar contraseña"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
