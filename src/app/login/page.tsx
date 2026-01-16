"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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

    router.push("/dashboard/leads");
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1fr]">
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-(--accent-lime)" />
              <p className="text-sm font-semibold text-foreground">WA Leads</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.4em] muted">Bienvenido</p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">Acceso</h1>
              <p className="mt-2 text-sm muted">
                Ingresa tus credenciales para acceder al dashboard.
              </p>
            </div>

            <div className="card" style={{ boxShadow: "none", border: "1px solid rgba(0,0,0,0.05)" }}>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Correo electrónico
                  </label>
                  <input
                    className="input"
                    type="email"
                    placeholder="tucorreo@empresa.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--text)]">
                    Contraseña
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-[var(--muted)]">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                    />
                    Recordar por 30 días
                  </label>
                  <button
                    type="button"
                    className="text-[var(--text)] underline-offset-4 hover:underline"
                  >
                    Olvidé mi contraseña
                  </button>
                </div>

                <button className="btn btn--primary w-full" type="submit">
                  {isLoading ? "Ingresando..." : "Iniciar sesión"}
                </button>
              </form>

              {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
            </div>

            <p className="text-sm text-center text-[var(--muted)]">
              ¿No tienes cuenta?{" "}
              <span className="text-[var(--text)] font-semibold">Contacta al admin</span>
            </p>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80')",
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-10 text-white">
            <p className="text-2xl font-semibold leading-9">
              “WA Leads nos permite priorizar y cerrar leads de WhatsApp sin fricción.”
            </p>
            <p className="mt-4 text-sm font-semibold">Equipo de Ventas</p>
            <p className="text-xs text-white/80">Operaciones, Tenant Default</p>
          </div>
        </div>
      </div>
    </div>
  );
}
