import { redirect } from "next/navigation";
import { WhatsappForm } from "@/components/onboarding/whatsapp-form";
import { fetchSessionData, fetchTenant, fetchTenantWhatsappStatus } from "@/lib/server-api";

export default async function OnboardingWhatsappPage() {
  const session = await fetchSessionData();
  if (!session.ok) redirect("/login");

  const tenantResult = await fetchTenant();
  if (!tenantResult.ok || !tenantResult.tenant?.id) redirect("/onboarding/tenant");

  const whatsappResult = await fetchTenantWhatsappStatus();
  if (whatsappResult.ok && whatsappResult.whatsapp.configured) {
    redirect("/onboarding/tree");
  }

  return (
    <div className="auth-shell">
      <div className="page__content">
        <div>
          <p className="section-kicker">Paso 2 de 3</p>
          <h1 className="section-title">Configura WhatsApp</h1>
          <p className="section-description">Conecta tu tenant para que el bot pueda recibir y responder mensajes.</p>
        </div>
        <WhatsappForm initialPhoneNumberId={whatsappResult.ok ? whatsappResult.whatsapp.phone_number_id || "" : ""} />
      </div>
    </div>
  );
}
