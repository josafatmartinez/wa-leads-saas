import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";
import {
  fetchSessionData,
  fetchTenant,
  fetchTenantTreeStatus,
  fetchTenantWhatsappStatus,
  signOut as signOutEndpoint,
} from "@/lib/server-api";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  let userEmail = "user@company.com";
  let tenantLabel = "Sin negocio";

  const session = await fetchSessionData();
  if (!session.ok || !session.user) {
    redirect("/login");
  }
  userEmail = session.user.email ?? userEmail;

  const tenantResult = await fetchTenant();
  if (!tenantResult.ok || !tenantResult.tenant?.id) {
    redirect("/onboarding/tenant");
  }

  tenantLabel = tenantResult.tenant.name || tenantResult.tenant.id;

  const whatsappResult = await fetchTenantWhatsappStatus();
  if (!whatsappResult.ok || !whatsappResult.whatsapp.configured) {
    redirect("/onboarding/whatsapp");
  }

  const treeResult = await fetchTenantTreeStatus();
  if (!treeResult.ok || !treeResult.tree.configured) {
    redirect("/onboarding/tree");
  }

  async function signOut() {
    "use server";
    await signOutEndpoint();
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <div>
          <div className="auth-brand">
            <span className="auth-brand__dot" />
            <p className="text-sm font-semibold text-white">WA Leads</p>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.32em] text-white/60">{tenantLabel}</p>
        </div>

        <SidebarNav />
      </aside>

      <main className="app-main">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <div className="avatar" />
            <div>
              <p className="text-sm font-semibold">WA Leads</p>
              <p className="text-xs muted">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link className="btn btn--ghost" href="/dashboard/leads">
              Leads
            </Link>
            <form action={signOut} method="post">
              <button type="submit" className="btn btn--secondary">
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>

        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
