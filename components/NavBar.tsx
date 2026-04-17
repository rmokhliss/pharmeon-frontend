"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Accueil",    icon: "🏠" },
  { href: "/products",  label: "Produits",   icon: "📦" },
  { href: "/stock/in",  label: "Entrée",     icon: "▲" },
  { href: "/stock/out", label: "Sortie",     icon: "▼" },
  { href: "/stock/log", label: "Opérations", icon: "📋" },
];

export default function NavBar() {
  const path = usePathname();

  return (
    <>
      {/* Desktop top bar */}
      <div className="hidden sm:flex bg-slate-800 border-b border-slate-700 px-6 py-3 items-center gap-2">
        <span className="text-white font-bold text-lg mr-6">Pharmeon</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              path.startsWith(l.href)
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}>
            <span>{l.icon}</span><span>{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Mobile top brand */}
      <div className="sm:hidden bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center">
        <span className="text-white font-bold text-lg">Pharmeon</span>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-800 border-t border-slate-700 flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              path.startsWith(l.href) ? "text-indigo-400" : "text-slate-500"
            }`}>
            <span className="text-base">{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
