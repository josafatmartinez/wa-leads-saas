import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { SidebarNav } from "@/components/sidebar-nav";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "user@company.com";

  async function signOut() {
    "use server";
    const supabaseAction = await getSupabaseServerClient();
    await supabaseAction.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[var(--accent-lime)]" />
            <p className="text-sm font-semibold text-white">WA Leads</p>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.4em] text-white/60">
            Default
          </p>
        </div>

        <SidebarNav />

        <div className="sidebar-card mt-auto">
          <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
          <p className="mt-2 text-xs text-white/70">
            Desbloquea reportes y automatizaciones avanzadas.
          </p>
          <button className="btn btn--primary mt-4 w-full text-sm" type="button">
            Upgrade now
          </button>
        </div>
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
            <form action={signOut}>
              <button className="btn btn--ghost" type="submit">
                Logout
              </button>
            </form>
          </div>
        </header>

        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
