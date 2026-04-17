"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/products", label: "Produits", icon: "📦" },
  { href: "/stock", label: "Stock", icon: "🏭" },
];

export default function NavBar() {
  const path = usePathname();
  return (
    <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center gap-6">
      <span className="text-white font-bold text-lg mr-4">Pharmeon</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
            path.startsWith(l.href)
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          <span>{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </div>
  );
}
