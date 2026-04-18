"use client";
import { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/admin-auth";

type Demande = {
  id: number;
  categorie: string;
  nom: string;
  type?: string;
  ville?: string;
  code_postal?: string;
  adresse?: string;
  telephone?: string;
  email: string;
  contact?: string;
  ice?: string;
  patente?: string;
  rc?: string;
  site_web?: string;
  message?: string;
  statut: string;
  createdAt: string;
};

const STATUTS = ["EN_ATTENTE", "APPROUVEE", "REJETEE"];

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente", APPROUVEE: "Approuvée", REJETEE: "Rejetée",
};

const STATUT_COLOR: Record<string, string> = {
  EN_ATTENTE: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  APPROUVEE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  REJETEE: "text-red-400 bg-red-500/10 border-red-500/20",
};

const CATEGORIE_LABEL: Record<string, string> = {
  PRO: "Professionnel", CLIENT_PUBLIC: "Particulier", FOURNISSEUR: "Fournisseur",
};

const CATEGORIE_COLOR: Record<string, string> = {
  PRO: "text-indigo-400 bg-indigo-500/10",
  CLIENT_PUBLIC: "text-slate-400 bg-slate-500/10",
  FOURNISSEUR: "text-purple-400 bg-purple-500/10",
};

export default function DemandesAccesPage() {
  const [all, setAll] = useState<Demande[]>([]);
  const [filter, setFilter] = useState("EN_ATTENTE");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminFetch<Demande[]>("/demandes").then(setAll).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: number, action: "approve" | "reject") => {
    setWorking(id);
    setError("");
    try {
      await adminFetch(`/demandes/${id}/${action}`, { method: "PATCH" });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(null);
    }
  };

  const visible = all.filter((d) => d.statut === filter);
  const counts = STATUTS.reduce<Record<string, number>>((m, s) => {
    m[s] = all.filter((d) => d.statut === s).length;
    return m;
  }, {});

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700">
        <p className="text-white font-medium">Demandes d&apos;accès</p>
        <p className="text-slate-400 text-xs mt-0.5">Formulaires d&apos;inscription en attente de validation</p>
      </div>

      <div className="px-6 pt-4 flex gap-2 flex-wrap">
        {STATUTS.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              filter === s ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
            }`}>
            {STATUT_LABEL[s]} <span className="ml-1 opacity-60">({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="px-6 pt-3">
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        </div>
      )}

      <div className="px-6 py-4 flex flex-col gap-3">
        {visible.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">Aucune demande {STATUT_LABEL[filter].toLowerCase()}</p>
        )}
        {visible.map((d) => {
          const isOpen = expanded === d.id;
          return (
            <div key={d.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : d.id)}
                className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-white text-sm font-medium truncate">{d.nom}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIE_COLOR[d.categorie] || "text-slate-400 bg-slate-700"}`}>
                      {CATEGORIE_LABEL[d.categorie] || d.categorie}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[d.statut]}`}>
                      {STATUT_LABEL[d.statut]}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs truncate">
                    {d.email}{d.ville ? ` · ${d.ville}` : ""}{d.type ? ` · ${d.type}` : ""}
                    {" · "}{new Date(d.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="text-slate-400 text-sm mt-0.5">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 px-4 py-3 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-400 text-xs">Email : </span><span className="text-white">{d.email}</span></div>
                    {d.telephone && <div><span className="text-slate-400 text-xs">Tél : </span><span className="text-white">{d.telephone}</span></div>}
                    {d.ville && <div><span className="text-slate-400 text-xs">Ville : </span><span className="text-white">{d.ville}{d.code_postal ? `, ${d.code_postal}` : ""}</span></div>}
                    {d.type && <div><span className="text-slate-400 text-xs">Type : </span><span className="text-white">{d.type}</span></div>}
                    {d.contact && <div><span className="text-slate-400 text-xs">Contact : </span><span className="text-white">{d.contact}</span></div>}
                    {d.adresse && <div className="sm:col-span-2"><span className="text-slate-400 text-xs">Adresse : </span><span className="text-white">{d.adresse}</span></div>}
                    {d.site_web && <div className="sm:col-span-2"><span className="text-slate-400 text-xs">Site web : </span><span className="text-white">{d.site_web}</span></div>}
                  </div>
                  {(d.ice || d.patente || d.rc) && (
                    <div className="bg-slate-900 rounded-lg px-3 py-2 grid grid-cols-3 gap-2 text-sm">
                      {d.ice && <div><p className="text-slate-500 uppercase tracking-wider text-[10px]">ICE</p><p className="text-white">{d.ice}</p></div>}
                      {d.patente && <div><p className="text-slate-500 uppercase tracking-wider text-[10px]">Patente</p><p className="text-white">{d.patente}</p></div>}
                      {d.rc && <div><p className="text-slate-500 uppercase tracking-wider text-[10px]">RC</p><p className="text-white">{d.rc}</p></div>}
                    </div>
                  )}
                  {d.message && (
                    <div className="bg-slate-900 rounded-lg px-3 py-2">
                      <p className="text-slate-400 text-xs mb-1">Message</p>
                      <p className="text-slate-200 text-sm">{d.message}</p>
                    </div>
                  )}
                  {d.statut === "EN_ATTENTE" && (
                    <div className="pt-2 border-t border-slate-700 flex gap-2">
                      <button onClick={() => act(d.id, "approve")} disabled={working === d.id}
                        className="flex-1 text-sm px-3 py-2 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/70 text-emerald-300 font-medium disabled:opacity-50">
                        ✓ Approuver
                      </button>
                      <button onClick={() => act(d.id, "reject")} disabled={working === d.id}
                        className="flex-1 text-sm px-3 py-2 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-400 font-medium disabled:opacity-50">
                        ✗ Rejeter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
