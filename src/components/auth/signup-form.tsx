"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SignupResponse = {
  ok: boolean;
  message?: string;
  requiresEmailConfirmation?: boolean;
};

type SignupFormProps = {
  redirectTo?: string;
};

export function SignupForm({ redirectTo = "/dashboard/leads" }: SignupFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; message?: string }>({
    type: "idle",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setStatus({ type: "error", message: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Las contraseñas no coinciden." });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "idle" });

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    const data = (await response.json()) as SignupResponse;

    if (!response.ok || !data.ok) {
      setStatus({ type: "error", message: data.message || "No se pudo crear la cuenta." });
      setIsLoading(false);
      return;
    }

    if (data.requiresEmailConfirmation) {
      setStatus({
        type: "success",
        message: "Cuenta creada. Revisa tu correo para confirmar tu acceso.",
      });
      setIsLoading(false);
      return;
    }

    router.push(redirectTo);
  };

  const loginHref =
    redirectTo && redirectTo !== "/dashboard/leads"
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/login";

  return (
    <div className="auth-card">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="field">
          <label className="text-sm font-semibold">Nombre completo</label>
          <input
            className="input"
            type="text"
            placeholder="Mariana López"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label className="text-sm font-semibold">Correo electrónico</label>
          <input
            className="input"
            type="email"
            placeholder="tucorreo@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label className="text-sm font-semibold">Contraseña</label>
          <input
            className="input"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="field">
          <label className="text-sm font-semibold">Confirmar contraseña</label>
          <input
            className="input"
            type="password"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {status.type === "error" && (
          <p className="auth-alert auth-alert--error" role="alert">
            {status.message}
          </p>
        )}
        {status.type === "success" && (
          <p className="auth-alert auth-alert--success" role="status">
            {status.message}
          </p>
        )}

        <button
          className="btn btn--primary w-full"
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm muted">
        ¿Ya tienes acceso?{" "}
        <Link className="auth-link" href={loginHref}>
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
