import { redirect } from "next/navigation";
import { TreeForm } from "@/components/onboarding/tree-form";
import { fetchSessionData, fetchTenant, fetchTenantTreeStatus, fetchTenantWhatsappStatus } from "@/lib/server-api";

export default async function OnboardingTreePage() {
  const session = await fetchSessionData();
  if (!session.ok) redirect("/login");

  const tenantResult = await fetchTenant();
  if (!tenantResult.ok || !tenantResult.tenant?.id) redirect("/onboarding/tenant");

  const whatsappResult = await fetchTenantWhatsappStatus();
  if (!whatsappResult.ok || !whatsappResult.whatsapp.configured) redirect("/onboarding/whatsapp");

  const treeResult = await fetchTenantTreeStatus();
  if (treeResult.ok && treeResult.tree.configured) {
    redirect("/dashboard/leads");
  }

  return (
    <div className="auth-shell">
      <div className="page__content">
        <div>
          <p className="section-kicker">Paso 3 de 3</p>
          <h1 className="section-title">Configura árbol de decisiones</h1>
          <p className="section-description">Define el flujo del bot para clasificar leads antes de abrir el dashboard.</p>
        </div>
        <TreeForm />
      </div>
    </div>
  );
}
