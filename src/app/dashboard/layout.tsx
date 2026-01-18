import type { ReactNode } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/sidebar-nav";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const userEmail = "user@company.com";

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
            <Link className="btn btn--ghost" href="/login">
              Logout
            </Link>
          </div>
        </header>

        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
