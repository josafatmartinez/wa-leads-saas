"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember }),
    });

    const data = (await response.json()) as { ok: boolean; message?: string };

    if (!response.ok || !data.ok) {
      setMessage(data.message || "Error al iniciar sesión.");
      setIsLoading(false);
      return;
    }

    router.push(redirectTo);
  };

  const signupHref =
    redirectTo && redirectTo !== "/dashboard/leads"
      ? `/signup?redirect=${encodeURIComponent(redirectTo)}`
      : "/signup";

  return (
    <div className="auth-card">
      <form className="space-y-4" onSubmit={handleSubmit}>
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
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm muted">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Recordar 30 días
          </label>
          <Link className="auth-link" href="/reset-password">
            Recuperar acceso
          </Link>
        </div>

        <button
          className="btn btn--primary w-full"
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? "Ingresando..." : "Entrar al dashboard"}
        </button>
      </form>

      {message && (
        <p className="auth-alert auth-alert--error mt-4" role="alert">
          {message}
        </p>
      )}

      <p className="mt-6 text-center text-sm muted">
        ¿No tienes cuenta?{" "}
        <Link className="auth-link" href={signupHref}>
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
