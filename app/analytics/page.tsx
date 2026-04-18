"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";

type Dashboard = {
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

type ProductRow = { id: number; nom: string; reference: string; quantite: number; revenue: number; cost: number; marge: number };
type ClientRow = { clientId: number; nom: string; type: string; totalCA: number; totalMarge: number; nbCommandes: number };
type SupplierRow = { fournisseurId: number; nom: string; totalAchats: number; nbCommandes: number };
type LossRow = {
  id: number;
  reference: string;
  type: string;
  createdAt: string;
  totalCost: number;
  items: { productNom: string; quantite: number; cost_price: number; totalLoss: number }[];
};

type Tab = "products" | "clients" | "suppliers" | "losses";

const TYPE_LABEL: Record<string, string> = {
  EXPIRATION: "Expiration", CASSE: "Casse", DOMMAGE: "Dommage", PERTE: "Perte", RETOUR: "Retour",
};

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [losses, setLosses] = useState<LossRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<Dashboard>("/analytics/dashboard").then(setDashboard).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setLoading(true); setError("");
    const urls: Record<Tab, string> = {
      products: "/analytics/profitability/products",
      clients: "/analytics/profitability/clients",
      suppliers: "/analytics/profitability/suppliers",
      losses: "/analytics/losses",
    };
    adminFetch<any>(urls[tab])
      .then((d) => {
        if (tab === "products") setProducts(d);
        else if (tab === "clients") setClients(d);
        else if (tab === "suppliers") setSuppliers(d);
        else setLosses(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab]);

  const kpiCard = (label: string, value: string, color: string, hint?: string) => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className={`${color} text-lg font-semibold mt-0.5`}>{value}</p>
      {hint && <p className="text-slate-500 text-[11px] mt-0.5">{hint}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700">
        <p className="text-white font-medium">Analytique</p>
        <p className="text-slate-400 text-xs mt-0.5">Performance, rentabilité et pertes</p>
      </div>

      {error && (
        <div className="px-6 pt-3">
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        </div>
      )}

      {dashboard && (
        <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {kpiCard("Chiffre d'affaires", `${dashboard.totalCA.toFixed(2)} MAD`, "text-emerald-400", "Commandes livrées")}
          {kpiCard("Marge nette", `${dashboard.totalMarge.toFixed(2)} MAD`, "text-indigo-400", "CA − coûts − pertes")}
          {kpiCard("Pertes validées", `${dashboard.totalPertes.toFixed(2)} MAD`, "text-red-400", "Ajustements")}
          {kpiCard("Commandes en attente", String(dashboard.commandesEnAttente), "text-amber-400")}
          {kpiCard("Stock en rupture", String(dashboard.ruptures), "text-red-400", `sur ${dashboard.totalProduits} produits`)}
          {kpiCard("Clients actifs", String(dashboard.totalClients), "text-blue-400", `${dashboard.totalCommandes} commandes au total`)}
        </div>
      )}

      <div className="px-6 pt-4 flex gap-2 flex-wrap">
        {(["products", "clients", "suppliers", "losses"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              tab === t ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
            }`}>
            {t === "products" && "Produits"}
            {t === "clients" && "Clients"}
            {t === "suppliers" && "Fournisseurs"}
            {t === "losses" && "Pertes"}
          </button>
        ))}
      </div>

      <div className="px-6 py-4 flex flex-col gap-3">
        {loading && <p className="text-slate-400 text-xs">Chargement…</p>}

        {!loading && tab === "products" && (
          <>
            {products.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucune vente livrée</p>}
            {products.map((p, idx) => (
              <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs font-mono">#{idx + 1}</span>
                      <p className="text-white text-sm font-medium truncate">{p.nom}</p>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{p.reference} · {p.quantite} vendus</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-indigo-300 text-sm font-semibold">{p.marge.toFixed(2)} MAD</p>
                    <p className="text-slate-500 text-[11px]">marge</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">CA : </span>
                    <span className="text-emerald-400">{p.revenue.toFixed(2)} MAD</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Coût : </span>
                    <span className="text-slate-300">{p.cost.toFixed(2)} MAD</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && tab === "clients" && (
          <>
            {clients.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucun client avec commandes livrées</p>}
            {clients.map((c, idx) => (
              <div key={c.clientId} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500 text-xs font-mono">#{idx + 1}</span>
                      <p className="text-white text-sm font-medium truncate">{c.nom}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{c.type}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{c.nbCommandes} commande{c.nbCommandes > 1 ? "s" : ""} livrée{c.nbCommandes > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-400 text-sm font-semibold">{c.totalCA.toFixed(2)} MAD</p>
                    <p className="text-slate-500 text-[11px]">CA</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
                  <span className="text-slate-500">Marge brute : </span>
                  <span className="text-indigo-300">{c.totalMarge.toFixed(2)} MAD</span>
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && tab === "suppliers" && (
          <>
            {suppliers.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucun BC fournisseur livré</p>}
            {suppliers.map((s, idx) => (
              <div key={s.fournisseurId} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs font-mono">#{idx + 1}</span>
                      <p className="text-white text-sm font-medium truncate">{s.nom}</p>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{s.nbCommandes} BC livré{s.nbCommandes > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-amber-400 text-sm font-semibold">{s.totalAchats.toFixed(2)} MAD</p>
                    <p className="text-slate-500 text-[11px]">achats</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && tab === "losses" && (
          <>
            {losses.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucune perte validée</p>}
            {losses.map((l) => (
              <div key={l.id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-medium">{l.reference}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{TYPE_LABEL[l.type] ?? l.type}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{new Date(l.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-red-400 text-sm font-semibold">{l.totalCost.toFixed(2)} MAD</p>
                    <p className="text-slate-500 text-[11px]">coût total</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700 flex flex-col gap-1">
                  {l.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <p className="text-slate-300">{it.productNom} × {it.quantite}</p>
                      <p className="text-slate-400">{it.totalLoss.toFixed(2)} MAD</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
