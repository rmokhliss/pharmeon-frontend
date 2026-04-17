"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPortailUser, portailFetch } from "@/lib/portail-auth";

type CommandeItem = { id: number; quantite: number; prixUnitaire: number; product: { nom: string; reference: string; unite: string } };
type Commande = { id: number; reference: string; statut: string; note?: string; createdAt: string; items: CommandeItem[] };

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente",
  VALIDEE: "Validée",
  EN_COURS: "En cours de livraison",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

const STATUT_COLOR: Record<string, string> = {
  EN_ATTENTE: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  VALIDEE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  EN_COURS: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  LIVREE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  ANNULEE: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function MesCommandesPage() {
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const u = getPortailUser();
    if (!u) { router.replace("/portail"); return; }
    portailFetch<Commande[]>("/commandes/mes-commandes")
      .then(setCommandes).finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Chargement...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-8">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/portail/catalogue")} className="text-slate-400 hover:text-white text-lg">←</button>
        <p className="text-white font-medium">Mes commandes</p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {commandes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">Aucune commande pour le moment</p>
            <button onClick={() => router.push("/portail/catalogue")}
              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
              Parcourir le catalogue →
            </button>
          </div>
        )}
        {commandes.map((c) => {
          const total = c.items.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0);
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : c.id)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white text-sm font-medium">{c.reference}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[c.statut] || "text-slate-400"}`}>
                      {STATUT_LABEL[c.statut] || c.statut}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{c.items.length} article{c.items.length > 1 ? "s" : ""}
                    {" · "}<span className="text-indigo-300">{total.toFixed(2)} MAD</span>
                  </p>
                </div>
                <span className="text-slate-400 text-sm">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 px-4 py-3 flex flex-col gap-2">
                  {c.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-white">{item.product.nom}</p>
                        <p className="text-slate-400 text-xs">{item.prixUnitaire.toFixed(2)} MAD × {item.quantite} {item.product.unite}</p>
                      </div>
                      <p className="text-indigo-300 font-medium">{(item.prixUnitaire * item.quantite).toFixed(2)} MAD</p>
                    </div>
                  ))}
                  {c.note && <p className="text-slate-400 text-xs mt-1 italic">Note : {c.note}</p>}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700 mt-1">
                    <span className="text-slate-400 text-sm">Total</span>
                    <span className="text-white font-bold">{total.toFixed(2)} MAD</span>
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
