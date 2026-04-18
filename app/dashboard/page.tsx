"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAdminToken, clearAdminSession } from "@/lib/admin-auth";
import Logo from "@/components/Logo";

const API = "/api";

type DashStats = {
  totalProduits: number;
  totalClients: number;
  totalCommandes: number;
  commandesEnAttente: number;
  stockBas: number;
  ruptures: number;
  totalCA: number;
  totalMarge: number;
  totalPertes: number;
};

type ProductProfit = {
  id: number;
  nom: string;
  reference: string;
  quantite: number;
  revenue: number;
  marge: number;
};

type ClientProfit = {
  clientId: number;
  nom: string;
  type: string;
  totalCA: number;
  totalMarge: number;
  nbCommandes: number;
};

type Loss = {
  id: number;
  reference: string;
  type: string;
  createdAt: string;
  totalCost: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [products, setProducts] = useState<ProductProfit[]>([]);
  const [clients, setClients] = useState<ClientProfit[]>([]);
  const [losses, setLosses] = useState<Loss[]>([]);
  const [tab, setTab] = useState<'overview' | 'products' | 'clients' | 'losses'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { router.replace("/admin/login"); return; }
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/analytics/dashboard`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/analytics/profitability/products`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/analytics/profitability/clients`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/analytics/losses`, { headers: h }).then((r) => r.json()),
    ])
      .then(([dash, prods, cls, los]) => {
        setStats(dash);
        setProducts(Array.isArray(prods) ? prods.slice(0, 10) : []);
        setClients(Array.isArray(cls) ? cls.slice(0, 10) : []);
        setLosses(Array.isArray(los) ? los : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  const kpis = [
    { label: 'Chiffre d\'affaires', value: stats ? fmt(stats.totalCA) : '—', color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: '💰' },
    { label: 'Marge nette', value: stats ? fmt(stats.totalMarge) : '—', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '📈' },
    { label: 'Pertes (stock)', value: stats ? fmt(stats.totalPertes) : '—', color: 'text-red-400', bg: 'bg-red-500/10', icon: '⚠️' },
    { label: 'Commandes en attente', value: stats?.commandesEnAttente ?? '—', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '🕐' },
    { label: 'Total commandes', value: stats?.totalCommandes ?? '—', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: '📦' },
    { label: 'Clients actifs', value: stats?.totalClients ?? '—', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: '👥' },
    { label: 'Stock bas', value: stats?.stockBas ?? '—', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: '📉' },
    { label: 'Ruptures', value: stats?.ruptures ?? '—', color: 'text-red-400', bg: 'bg-red-500/10', icon: '🚫' },
  ];

  const tabs = [
    { key: 'overview', label: 'Vue générale' },
    { key: 'products', label: 'Par produit' },
    { key: 'clients', label: 'Par client' },
    { key: 'losses', label: 'Pertes' },
  ] as const;

  const quickActions = [
    { href: '/products', label: 'Catalogue', icon: '📦', color: 'border-indigo-500/30 hover:border-indigo-500' },
    { href: '/commandes', label: 'Commandes', icon: '🛒', color: 'border-blue-500/30 hover:border-blue-500' },
    { href: '/clients', label: 'Clients', icon: '👥', color: 'border-purple-500/30 hover:border-purple-500' },
    { href: '/fournisseurs', label: 'Fournisseurs', icon: '🏭', color: 'border-emerald-500/30 hover:border-emerald-500' },
    { href: '/stock', label: 'Stock', icon: '📋', color: 'border-slate-500/30 hover:border-slate-500' },
    { href: '/admin/adjustments', label: 'Ajustements', icon: '⚠️', color: 'border-red-500/30 hover:border-red-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <div>
            <h1 className="text-white font-semibold">Tableau de bord</h1>
            <p className="text-slate-400 text-xs">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => { clearAdminSession(); router.push('/'); }}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Déconnexion
        </button>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className={`${k.bg} border border-slate-700 rounded-xl p-4`}>
              <div className="text-2xl mb-2">{k.icon}</div>
              <div className={`text-xl font-bold ${k.color} truncate`}>
                {loading ? <span className="text-slate-600">—</span> : k.value}
              </div>
              <div className="text-slate-400 text-xs mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div>
            <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Accès rapides</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`bg-slate-800 border ${a.color} rounded-xl p-4 flex items-center gap-3 transition-colors`}
                >
                  <span className="text-xl w-9 h-9 flex items-center justify-center bg-slate-700 rounded-lg shrink-0">
                    {a.icon}
                  </span>
                  <span className="text-white text-sm font-medium">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div>
            <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
              Top 10 produits — marge nette
            </h2>
            {loading ? (
              <p className="text-slate-500 text-sm">Chargement…</p>
            ) : products.length === 0 ? (
              <p className="text-slate-500 text-sm">Aucune donnée (commandes livrées requises)</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 text-slate-400 font-medium">Produit</th>
                      <th className="text-right py-2 text-slate-400 font-medium">Qté vendue</th>
                      <th className="text-right py-2 text-slate-400 font-medium">CA</th>
                      <th className="text-right py-2 text-slate-400 font-medium">Marge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-3">
                          <p className="text-white font-medium">{p.nom}</p>
                          <p className="text-slate-500 text-xs">{p.reference}</p>
                        </td>
                        <td className="py-3 text-right text-slate-300">{p.quantite}</td>
                        <td className="py-3 text-right text-slate-300">{fmt(p.revenue)}</td>
                        <td className={`py-3 text-right font-semibold ${
                          p.marge >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {fmt(p.marge)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'clients' && (
          <div>
            <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
              Top 10 clients — chiffre d'affaires
            </h2>
            {loading ? (
              <p className="text-slate-500 text-sm">Chargement…</p>
            ) : clients.length === 0 ? (
              <p className="text-slate-500 text-sm">Aucune donnée</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 text-slate-400 font-medium">Client</th>
                      <th className="text-right py-2 text-slate-400 font-medium">Commandes</th>
                      <th className="text-right py-2 text-slate-400 font-medium">CA total</th>
                      <th className="text-right py-2 text-slate-400 font-medium">Marge générée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.clientId} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-3">
                          <p className="text-white font-medium">{c.nom}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            c.type === 'PHARMACIE' ? 'bg-blue-500/20 text-blue-400' :
                            c.type === 'PARA' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>{c.type}</span>
                        </td>
                        <td className="py-3 text-right text-slate-300">{c.nbCommandes}</td>
                        <td className="py-3 text-right text-slate-300">{fmt(c.totalCA)}</td>
                        <td className={`py-3 text-right font-semibold ${
                          c.totalMarge >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {fmt(c.totalMarge)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'losses' && (
          <div>
            <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
              Historique des ajustements validés (pertes)
            </h2>
            {loading ? (
              <p className="text-slate-500 text-sm">Chargement…</p>
            ) : losses.length === 0 ? (
              <p className="text-slate-500 text-sm">Aucune perte enregistrée</p>
            ) : (
              <div className="space-y-2">
                {losses.map((l) => (
                  <div key={l.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{l.reference}</p>
                      <p className="text-slate-500 text-xs">
                        {l.type} — {new Date(l.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className="text-red-400 font-bold text-sm">- {fmt(l.totalCost)}</span>
                  </div>
                ))}
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center justify-between mt-2">
                  <span className="text-red-300 font-semibold text-sm">Total pertes</span>
                  <span className="text-red-400 font-bold">
                    - {fmt(losses.reduce((s, l) => s + l.totalCost, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
