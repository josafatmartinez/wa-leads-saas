"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WhatsappFormProps = {
  initialPhoneNumberId?: string;
};

export function WhatsappForm({ initialPhoneNumberId = "" }: WhatsappFormProps) {
  const router = useRouter();
  const [phoneNumberId, setPhoneNumberId] = useState(initialPhoneNumberId);
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);

    const response = await fetch("/api/tenant/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumberId,
        accessToken,
        verifyToken,
        metaAppSecret,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) {
      setMessage(payload?.error || payload?.message || "No se pudo guardar la configuración de WhatsApp.");
      setIsSaving(false);
      return;
    }

    router.push("/onboarding/tree");
  };

  return (
    <form className="auth-card space-y-4" onSubmit={onSubmit}>
      <div className="field">
        <label className="text-sm font-semibold">Phone Number ID</label>
        <input
          className="input"
          value={phoneNumberId}
          onChange={(event) => setPhoneNumberId(event.target.value)}
          placeholder="1234567890"
          required
        />
      </div>

      <div className="field">
        <label className="text-sm font-semibold">Access Token</label>
        <input
          className="input"
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          placeholder="EAAG..."
        />
      </div>

      <div className="field">
        <label className="text-sm font-semibold">Verify Token</label>
        <input
          className="input"
          value={verifyToken}
          onChange={(event) => setVerifyToken(event.target.value)}
          placeholder="my-verify-token"
        />
      </div>

      <div className="field">
        <label className="text-sm font-semibold">Meta App Secret</label>
        <input
          className="input"
          value={metaAppSecret}
          onChange={(event) => setMetaAppSecret(event.target.value)}
          placeholder="app-secret"
        />
      </div>

      {message ? <p className="text-sm text-red-600">{message}</p> : null}

      <button className="btn btn--primary w-full" disabled={isSaving} type="submit">
        {isSaving ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
