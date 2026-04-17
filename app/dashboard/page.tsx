"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Stats = {
  totalProduits: number;
  stockBas: number;
  ruptures: number;
  mouvementsAujourdhui: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/products`).then((r) => r.json()),
      fetch(`${API}/stock`).then((r) => r.json()),
    ]).then(([products, movements]) => {
      const today = new Date().toDateString();
      setStats({
        totalProduits: products.length,
        stockBas: products.filter((p: any) => p.stock > 0 && p.stock <= p.stock_min).length,
        ruptures: products.filter((p: any) => p.stock === 0).length,
        mouvementsAujourdhui: movements.filter(
          (m: any) => new Date(m.createdAt).toDateString() === today
        ).length,
      });
    });
  }, []);

  const cards = [
    { label: "Produits",          value: stats?.totalProduits, color: "text-indigo-400",  bg: "bg-indigo-500/10",  icon: "📦", href: "/products" },
    { label: "Stock bas",         value: stats?.stockBas,      color: "text-yellow-400", bg: "bg-yellow-500/10", icon: "⚠️", href: "/products" },
    { label: "Ruptures",          value: stats?.ruptures,      color: "text-red-400",    bg: "bg-red-500/10",    icon: "🚫", href: "/products" },
    { label: "Opérations / jour", value: stats?.mouvementsAujourdhui, color: "text-emerald-400", bg: "bg-emerald-500/10", icon: "📋", href: "/stock/log" },
  ];

  const actions = [
    { href: "/products",  label: "Catalogue produits",  desc: "Consulter et gérer les produits",    icon: "📦", color: "border-indigo-500/30 hover:border-indigo-500" },
    { href: "/stock/in",  label: "Entrée stock",         desc: "Enregistrer une réception",          icon: "▲",  color: "border-emerald-500/30 hover:border-emerald-500" },
    { href: "/stock/out", label: "Sortie stock",         desc: "Enregistrer une expédition",         icon: "▼",  color: "border-red-500/30 hover:border-red-500" },
    { href: "/stock/log", label: "Historique opérations", desc: "Consulter tous les mouvements",    icon: "📋", color: "border-slate-500/30 hover:border-slate-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-white font-semibold">Tableau de bord</h1>
        <p className="text-slate-400 text-xs mt-0.5">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map((c) => (
            <Link key={c.label} href={c.href}
              className={`${c.bg} border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors`}>
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className={`text-2xl font-bold ${c.color}`}>
                {stats ? c.value : <span className="text-slate-600">—</span>}
              </div>
              <div className="text-slate-400 text-xs mt-1">{c.label}</div>
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div>
          <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actions.map((a) => (
              <Link key={a.href} href={a.href}
                className={`bg-slate-800 border ${a.color} rounded-xl p-4 flex items-center gap-4 transition-colors`}>
                <span className="text-2xl w-10 h-10 flex items-center justify-center bg-slate-700 rounded-lg shrink-0">
                  {a.icon}
                </span>
                <div>
                  <p className="text-white text-sm font-medium">{a.label}</p>
                  <p className="text-slate-400 text-xs">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
