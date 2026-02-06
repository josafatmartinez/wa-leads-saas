"use client";

import { Alert } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export default function AuthHashPage() {
  const router = useRouter();
  const message = useMemo(
    () => "Este flujo de hash de Supabase ya no está habilitado. Usa login con /auth/sessions.",
    []
  );

  return (
    <div className="auth-shell">
      <div className="page__content">
        <div className="card">
          <Alert variant="destructive">{message}</Alert>

          <button className="btn btn--primary mt-4" onClick={() => router.push("/login")}>
            Ir a login
          </button>
        </div>
      </div>
    </div>
  );
}
