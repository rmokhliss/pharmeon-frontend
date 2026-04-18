"use client";
import { useEffect, useState, useCallback } from "react";
import { adminFetch, getAdminToken } from "@/lib/admin-auth";

type BLList = {
  id: number;
  reference: string;
  statut: string;
  delivery_date?: string;
  tracking_number?: string;
  createdAt: string;
  commande: { reference: string; client: { nom: string } };
};

type BLDetail = BLList & {
  commande: {
    reference: string;
    client: { nom: string; ville?: string; telephone?: string; adresse?: string };
    items: { id: number; quantite: number; product: { nom: string; reference: string; unite: string } }[];
  };
};

const STATUTS = ["EN_PREPARATION", "LIVRE"];

const STATUT_LABEL: Record<string, string> = {
  EN_PREPARATION: "En préparation", LIVRE: "Livré",
};

const STATUT_COLOR: Record<string, string> = {
  EN_PREPARATION: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  LIVRE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function DeliveryNotesPage() {
  const [bls, setBls] = useState<BLList[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<BLDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminFetch<BLList[]>("/delivery-notes").then(setBls).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: number) => {
    if (expanded === id) { setExpanded(null); setDetail(null); return; }
    setExpanded(id);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const d = await adminFetch<BLDetail>(`/delivery-notes/${id}`);
      setDetail(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openPdf = (id: number) => {
    const token = getAdminToken();
    if (!token) { setError("Session expirée"); return; }
    fetch(`/api/delivery-notes/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((b) => { const url = URL.createObjectURL(b); window.open(url, "_blank"); })
      .catch(() => setError("Erreur génération PDF"));
  };

  const visible = bls.filter((bl) => {
    if (filter !== "ALL" && bl.statut !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return bl.reference.toLowerCase().includes(q) ||
             bl.commande.reference.toLowerCase().includes(q) ||
             bl.commande.client.nom.toLowerCase().includes(q) ||
             (bl.tracking_number || "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700">
        <p className="text-white font-medium">Bons de livraison</p>
        <p className="text-slate-400 text-xs mt-0.5">Générés à la livraison d&apos;une commande</p>
      </div>

      <div className="px-6 pt-4 flex flex-col gap-3">
        <input type="text" placeholder="Rechercher réf, commande, client, tracking…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        <div className="flex gap-2 flex-wrap">
          {["ALL", ...STATUTS].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                filter === s ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
              }`}>
              {s === "ALL" ? "Tous" : STATUT_LABEL[s]}
              {s !== "ALL" && <span className="ml-1 opacity-60">({bls.filter((bl) => bl.statut === s).length})</span>}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-6 pt-3">
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        </div>
      )}

      <div className="px-6 py-4 flex flex-col gap-3">
        {visible.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucun bon de livraison</p>}
        {visible.map((bl) => {
          const isOpen = expanded === bl.id;
          return (
            <div key={bl.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => toggle(bl.id)}
                className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-white text-sm font-medium">{bl.reference}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[bl.statut]}`}>
                      {STATUT_LABEL[bl.statut]}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs truncate">
                    {bl.commande.client.nom} · Cmd {bl.commande.reference}
                    {" · "}{bl.delivery_date ? new Date(bl.delivery_date).toLocaleDateString("fr-FR") : new Date(bl.createdAt).toLocaleDateString("fr-FR")}
                    {bl.tracking_number && <> · <span className="text-indigo-300 font-mono">{bl.tracking_number}</span></>}
                  </p>
                </div>
                <span className="text-slate-400 text-sm mt-0.5">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 px-4 py-3 flex flex-col gap-3">
                  {loadingDetail && <p className="text-slate-400 text-xs">Chargement…</p>}
                  {detail && detail.id === bl.id && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs mb-0.5">Client</p>
                          <p className="text-white">{detail.commande.client.nom}</p>
                          {detail.commande.client.ville && <p className="text-slate-400 text-xs">{detail.commande.client.ville}</p>}
                          {detail.commande.client.telephone && <p className="text-slate-400 text-xs">{detail.commande.client.telephone}</p>}
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs mb-0.5">Livraison</p>
                          <p className="text-white">{detail.delivery_date ? new Date(detail.delivery_date).toLocaleDateString("fr-FR") : "—"}</p>
                          {detail.tracking_number && <p className="text-slate-400 text-xs">Suivi : {detail.tracking_number}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-700">
                        {detail.commande.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <p className="text-slate-300">{item.product.nom}</p>
                            <p className="text-slate-400 text-xs">{item.quantite} {item.product.unite}</p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-slate-700">
                        <button onClick={() => openPdf(bl.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200">
                          📄 Voir PDF
                        </button>
                      </div>
                    </>
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
