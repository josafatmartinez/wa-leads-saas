"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Leads", href: "/dashboard/leads", badge: "3" },
  { label: "Usuarios", href: "/dashboard/users" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-3 text-sm">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`nav-item ${isActive ? "nav-item--active" : ""}`}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-[var(--accent-lime)] px-2 py-0.5 text-[10px] font-semibold text-black">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
