import { CasusLogo } from "@/components/ui/CasusLogo";
import Link from "next/link";
import { PenLine, FolderOpen, LayoutGrid, UserRound, CreditCard, Calendar } from "lucide-react";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: LayoutGrid },
  { href: "/dashboard/create", label: "Crear contenido", icon: PenLine },
  { href: "/dashboard/library", label: "Biblioteca", icon: FolderOpen },
  { href: "/dashboard/calendar", label: "Calendario", icon: Calendar },
  { href: "/dashboard/plans", label: "Planes", icon: CreditCard },
  { href: "/dashboard/profile", label: "Perfil", icon: UserRound },
];

export function DashboardShell({
  children,
  displayName,
}: {
  children: React.ReactNode;
  displayName?: string;
}) {
  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-white focus:px-3 focus:py-2 focus:rounded-md"
      >
        Saltar al contenido principal
      </a>

      <aside className="w-60 shrink-0 border-r border-line bg-surface px-4 py-6 hidden md:flex md:flex-col">
        <div className="flex items-center gap-2 px-2 mb-8">
          <CasusLogo size={26} />
          <span className="font-display text-xl text-primary">CASUS</span>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Navegación principal">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-primary-soft hover:text-primary transition-colors"
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>
        {displayName && (
          <div className="mt-auto px-2 text-xs text-ink-muted">Sesión: {displayName}</div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-line bg-surface sticky top-0 z-10">
          <span className="flex items-center gap-1.5 font-display text-lg text-primary">
            <CasusLogo size={22} />
            CASUS
          </span>
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:px-10 md:py-10 md:pb-10">
          {children}
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
