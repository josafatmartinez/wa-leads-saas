"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?redirect=/dashboard/leads`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Te enviamos un enlace de acceso.");
  };

  return (
    <div className="page">
      <div className="page__content">
        <div className="card">
          <p className="text-xs uppercase tracking-[0.4em] muted">WA Leads</p>
          <h1 className="mt-2 text-3xl font-semibold">Acceso</h1>
          <p className="mt-2 text-sm muted">
            Ingresa tu email y recibe un enlace mágico.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <input
              className="input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button className="btn btn--primary w-full" type="submit">
              Enviar enlace
            </button>
          </form>

          {status !== "idle" && <p className="mt-4 text-sm">{message}</p>}
        </div>
      </div>
    </div>
  );
}
