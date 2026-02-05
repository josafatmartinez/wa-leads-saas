"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status =
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type HashTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: string;
  expires_at?: string;
  token_type?: string;
  provider_token?: string;
};

export default function AuthHashPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ type: "loading" });

  useEffect(() => {
    const params = parseHashTokens();
    if (!params.access_token || !params.refresh_token) {
      setStatus({ type: "error", message: "Token de acceso inválido." });
      return;
    }

    handleSession(params);
  }, [handleSession]);

  const handleSession = useCallback(
    async (tokens: HashTokens) => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in
              ? Number(tokens.expires_in)
              : undefined,
            expires_at: tokens.expires_at
              ? Number(tokens.expires_at)
              : undefined,
            provider_token: tokens.provider_token,
            token_type: tokens.token_type,
          }),
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error || "No se pudo abrir la sesión.");
        }

        setStatus({
          type: "success",
          message: "Sesión confirmada, redirigiendo...",
        });
        router.replace("/reset-password");
      } catch (error) {
        setStatus({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Falló la creación de la sesión.",
        });
      }
    },
    [router]
  );

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-2 sm:p-3">
        <CardHeader className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">
            WA Leads
          </p>
          <CardTitle>Procesando invitación</CardTitle>
          <CardDescription>
            Validando credenciales y preparando el reset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-[var(--muted)]">
          {status.type === "loading" && (
            <div className="flex items-center justify-center gap-2 text-[var(--foreground)]">
              <span className="h-3 w-3 animate-ping rounded-full bg-indigo-500" />
              <span>Redirigiendo...</span>
            </div>
          )}

          {status.type === "error" && (
            <Alert variant="destructive">{status.message}</Alert>
          )}

          {status.type === "success" && (
            <Alert variant="success">{status.message}</Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function parseHashTokens(): HashTokens {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);

  return {
    access_token: params.get("access_token") ?? undefined,
    refresh_token: params.get("refresh_token") ?? undefined,
    expires_in: params.get("expires_in") ?? undefined,
    expires_at: params.get("expires_at") ?? undefined,
    token_type: params.get("token_type") ?? undefined,
    provider_token: params.get("provider_token") ?? undefined,
  };
}
