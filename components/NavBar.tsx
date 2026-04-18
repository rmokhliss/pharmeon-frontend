"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getAdminToken } from "@/lib/admin-auth";
import Logo from "@/components/Logo";

const mainLinks = [
  { href: "/dashboard",    label: "Accueil",   icon: "\uD83C\uDFE0" },
  { href: "/products",     label: "Produits",  icon: "\uD83D\uDCE6" },
  { href: "/commandes",    label: "Commandes", icon: "\uD83D\uDED2" },
  { href: "/purchase-orders", label: "BC Fourn.", icon: "\uD83D\uDCCB" },
];

const moreLinks = [
  { href: "/clients",         label: "Clients",       icon: "\uD83D\uDC65" },
  { href: "/fournisseurs",    label: "Fournisseurs",  icon: "\uD83C\uDFED" },
  { href: "/demandes-acces",  label: "Demandes",      icon: "\uD83D\uDCE5" },
  { href: "/delivery-notes",  label: "Livraisons",    icon: "\uD83D\uDE9A" },
  { href: "/adjustments",     label: "Ajustements",   icon: "\u2696\uFE0F"  },
  { href: "/analytics",       label: "Analytique",    icon: "\uD83D\uDCCA" },
  { href: "/stock/log",       label: "Op\u00e9rations",     icon: "\uD83D\uDCCB" },
];

const allLinks = [...mainLinks, ...moreLinks];

const ADMIN_PREFIXES = ["/dashboard", "/products", "/stock", "/clients", "/fournisseurs", "/commandes", "/purchase-orders", "/adjustments", "/analytics", "/demandes-acces", "/delivery-notes"];

export default function NavBar() {
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingClients, setPendingClients] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(0);
  const [pendingDemandes, setPendingDemandes] = useState(0);

  const isAdminPath = ADMIN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

  useEffect(() => {
    if (!isAdminPath || !getAdminToken()) return;
    fetch("/api/commandes/pending-count").then((r) => r.json()).then((n) => setPendingOrders(n || 0)).catch(() => {});
    fetch("/api/clients/pending-count").then((r) => r.json()).then((n) => setPendingClients(n || 0)).catch(() => {});
    fetch("/api/clients/pending-approval-count").then((r) => r.json()).then((n) => setPendingApproval(n || 0)).catch(() => {});
    fetch("/api/demandes/pending-count", { headers: { Authorization: `Bearer ${getAdminToken()}` } }).then((r) => r.json()).then((n) => setPendingDemandes(n || 0)).catch(() => {});
  }, [isAdminPath, path]);

  if (!isAdminPath) return null;

  const moreActive = moreLinks.some((l) => path.startsWith(l.href));

  const badge = (count: number) =>
    count > 0 ? (
      <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
        {count > 9 ? "9+" : count}
      </span>
    ) : null;

  const linkLabel = (l: { href: string; label: string; icon: string }) => {
    if (l.href === "/commandes") return <>{l.label}{badge(pendingOrders)}</>;
    if (l.href === "/clients") return <>{l.label}{badge(pendingClients + pendingApproval)}</>;
    if (l.href === "/demandes-acces") return <>{l.label}{badge(pendingDemandes)}</>;
    return l.label;
  };

  return (
    <>
      {/* Desktop top bar */}
      <div className="hidden sm:flex bg-slate-800 border-b border-slate-700 px-6 py-3 items-center gap-2 flex-wrap">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Logo size={24} /><span className="text-white font-bold text-lg">Pharmeon</span>
        </Link>
        {allLinks.map((l) => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              path.startsWith(l.href)
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}>
            <span>{l.icon}</span><span className="flex items-center">{linkLabel(l)}</span>
          </Link>
        ))}
      </div>

      {/* Mobile top brand */}
      <div className="sm:hidden bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} /><span className="text-white font-bold text-lg">Pharmeon</span>
        </Link>
      </div>

      {/* Mobile "Plus" overlay menu */}
      {moreOpen && (
        <div className="sm:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-slate-800 border-t border-slate-700 px-4 py-3 flex flex-col gap-1"
            onClick={(e) => e.stopPropagation()}>
            {moreLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  path.startsWith(l.href) ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-700"
                }`}>
                <span className="text-lg">{l.icon}</span>
                <span className="flex items-center">{linkLabel(l)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-800 border-t border-slate-700 flex">
        {mainLinks.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setMoreOpen(false)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              path.startsWith(l.href) ? "text-indigo-400" : "text-slate-500"
            }`}>
            <span className="text-base">{l.icon}</span>
            <span className="flex items-center">{linkLabel(l)}</span>
          </Link>
        ))}
        <button onClick={() => setMoreOpen((o) => !o)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors relative ${
            moreActive || moreOpen ? "text-indigo-400" : "text-slate-500"
          }`}>
          <span className="text-base relative">
            &bull;&bull;&bull;
            {(pendingClients + pendingApproval + pendingDemandes > 0) && (
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </span>
          <span>Plus</span>
        </button>
      </div>
    </>
  );
}
