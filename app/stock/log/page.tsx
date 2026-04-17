"use client";
import { useEffect, useState } from "react";

const API = "/api";

type Movement = {
  id: number;
  type: "ENTREE" | "SORTIE";
  quantite: number;
  note?: string;
  createdAt: string;
  product: { nom: string; reference: string; unite: string };
};

export default function StockLogPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ENTREE" | "SORTIE">("ALL");

  useEffect(() => {
    fetch(`${API}/stock`)
      .then((r) => r.json())
      .then(setMovements)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? movements : movements.filter((m) => m.type === filter);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <p className="text-slate-400 text-sm font-medium">Historique des opérations</p>
        <span className="text-slate-500 text-xs">{filtered.length} opération(s)</span>
      </div>

      <div className="px-6 py-4">
        {/* Filtre */}
        <div className="flex gap-2 mb-4">
          {(["ALL", "ENTREE", "SORTIE"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? f === "ENTREE" ? "bg-emerald-600 text-white"
                    : f === "SORTIE" ? "bg-red-600 text-white"
                    : "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}>
              {f === "ALL" ? "Tout" : f === "ENTREE" ? "▲ Entrées" : "▼ Sorties"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-12">Aucune opération</p>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl divide-y divide-slate-700">
            {filtered.map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  m.type === "ENTREE" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {m.type === "ENTREE" ? "▲" : "▼"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{m.product.nom}</p>
                  <p className="text-slate-400 text-xs">{m.note || <span className="italic">Sans note</span>}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${m.type === "ENTREE" ? "text-emerald-400" : "text-red-400"}`}>
                    {m.type === "ENTREE" ? "+" : "-"}{m.quantite} {m.product.unite}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {new Date(m.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
