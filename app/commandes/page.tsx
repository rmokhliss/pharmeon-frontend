"use client";
import { useEffect, useState, useCallback } from "react";

const API = "/api";

type CommandeItem = { id: number; quantite: number; prixUnitaire: number; product: { nom: string } };
type Commande = { id: number; reference: string; statut: string; createdAt: string; note?: string; client: { nom: string; ville?: string; type: string }; items: CommandeItem[] };

const STATUTS = ["EN_ATTENTE", "VALIDEE", "EN_COURS", "LIVREE", "ANNULEE"];

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente", VALIDEE: "Validée", EN_COURS: "En cours",
  LIVREE: "Livrée", ANNULEE: "Annulée",
};

const STATUT_COLOR: Record<string, string> = {
  EN_ATTENTE: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  VALIDEE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  EN_COURS: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  LIVREE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  ANNULEE: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function CommandesAdminPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [filter, setFilter] = useState("EN_ATTENTE");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch(`${API}/commandes`).then((r) => r.json()).then(setCommandes);
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatut = async (id: number, statut: string) => {
    setUpdating(id);
    await fetch(`${API}/commandes/${id}/statut`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setUpdating(null);
    load();
  };

  const visible = filter === "ALL" ? commandes : commandes.filter((c) => c.statut === filter);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700">
        <p className="text-white font-medium">Gestion des commandes</p>
      </div>

      <div className="px-6 pt-4 flex gap-2 flex-wrap">
        {["ALL", ...STATUTS].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              filter === s ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
            }`}>
            {s === "ALL" ? "Toutes" : STATUT_LABEL[s]}
            {s !== "ALL" && <span className="ml-1 opacity-60">({commandes.filter((c) => c.statut === s).length})</span>}
          </button>
        ))}
      </div>

      <div className="px-6 py-4 flex flex-col gap-3">
        {visible.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucune commande</p>}
        {visible.map((c) => {
          const total = c.items.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0);
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : c.id)} className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-white text-sm font-medium">{c.reference}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[c.statut]}`}>
                      {STATUT_LABEL[c.statut]}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    {c.client.nom} · {c.client.ville || c.client.type}
                    {" · "}{new Date(c.createdAt).toLocaleDateString("fr-FR")}
                    {" · "}<span className="text-indigo-300">{total.toFixed(2)} MAD</span>
                  </p>
                </div>
                <span className="text-slate-400 text-sm mt-0.5">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 px-4 py-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    {c.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <p className="text-slate-300">{item.product.nom} × {item.quantite}</p>
                        <p className="text-indigo-300">{(item.prixUnitaire * item.quantite).toFixed(2)} MAD</p>
                      </div>
                    ))}
                    {c.note && <p className="text-slate-400 text-xs italic mt-1">Note : {c.note}</p>}
                  </div>
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Changer le statut :</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUTS.filter((s) => s !== c.statut).map((s) => (
                        <button key={s} onClick={() => changeStatut(c.id, s)} disabled={updating === c.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 transition-colors">
                          → {STATUT_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
