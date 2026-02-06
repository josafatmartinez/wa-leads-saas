import { redirect } from "next/navigation";
import { TenantForm } from "@/components/onboarding/tenant-form";
import { fetchSessionData, fetchTenant } from "@/lib/server-api";

export default async function OnboardingTenantPage() {
  const session = await fetchSessionData();
  if (!session.ok) redirect("/login");

  const tenantResult = await fetchTenant();
  if (tenantResult.ok && tenantResult.tenant?.id) {
    redirect("/onboarding/whatsapp");
  }

  return (
    <div className="auth-shell">
      <div className="page__content">
        <div>
          <p className="section-kicker">Paso 1 de 3</p>
          <h1 className="section-title">Crea tu negocio</h1>
          <p className="section-description">Registra tu tenant para activar la configuración inicial.</p>
        </div>
        <TenantForm initialName={tenantResult.ok ? tenantResult.tenant?.name || "" : ""} />
      </div>
    </div>
  );
}
