"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, FolderOpen, LayoutGrid, UserRound } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: LayoutGrid },
  { href: "/dashboard/create", label: "Crear", icon: PenLine },
  { href: "/dashboard/library", label: "Biblioteca", icon: FolderOpen },
  { href: "/dashboard/profile", label: "Perfil", icon: UserRound },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex border-t border-line bg-surface"
      aria-label="Navegación principal"
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors",
              active ? "text-primary" : "text-ink-muted"
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.1 : 1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
