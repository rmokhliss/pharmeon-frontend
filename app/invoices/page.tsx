"use client";
import { useEffect, useState, useCallback } from "react";
import { adminFetch, getAdminToken } from "@/lib/admin-auth";

type InvoiceList = {
  id: number;
  reference: string;
  statut: string;
  total_ht: number;
  total_ttc: number;
  issued_at?: string;
  createdAt: string;
  commande: { reference: string; client: { nom: string } };
};

type InvoiceDetail = InvoiceList & {
  commande: {
    reference: string;
    client: { nom: string; ville?: string; telephone?: string; adresse?: string };
    items: { id: number; quantite: number; prixUnitaire: number; final_price?: number; product: { nom: string; reference: string; unite: string } }[];
  };
};

const STATUTS = ["BROUILLON", "EMISE", "PAYEE"];

const STATUT_LABEL: Record<string, string> = {
  BROUILLON: "Brouillon", EMISE: "Émise", PAYEE: "Payée",
};

const STATUT_COLOR: Record<string, string> = {
  BROUILLON: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  EMISE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PAYEE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceList[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminFetch<InvoiceList[]>("/invoices").then(setInvoices).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: number) => {
    if (expanded === id) { setExpanded(null); setDetail(null); return; }
    setExpanded(id);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const d = await adminFetch<InvoiceDetail>(`/invoices/${id}`);
      setDetail(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const changeStatut = async (id: number, statut: string) => {
    setUpdating(id); setError("");
    try {
      await adminFetch(`/invoices/${id}/statut`, { method: "PATCH", body: JSON.stringify({ statut }) });
      load();
      if (expanded === id) {
        const d = await adminFetch<InvoiceDetail>(`/invoices/${id}`);
        setDetail(d);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const openPdf = (id: number) => {
    const token = getAdminToken();
    if (!token) { setError("Session expirée"); return; }
    fetch(`/api/invoices/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((b) => { const url = URL.createObjectURL(b); window.open(url, "_blank"); })
      .catch(() => setError("Erreur génération PDF"));
  };

  const visible = invoices.filter((f) => {
    if (filter !== "ALL" && f.statut !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.reference.toLowerCase().includes(q) ||
             f.commande.reference.toLowerCase().includes(q) ||
             f.commande.client.nom.toLowerCase().includes(q);
    }
    return true;
  });

  const totals = {
    EMISE: invoices.filter((f) => f.statut === "EMISE").reduce((s, f) => s + f.total_ttc, 0),
    PAYEE: invoices.filter((f) => f.statut === "PAYEE").reduce((s, f) => s + f.total_ttc, 0),
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700">
        <p className="text-white font-medium">Factures</p>
        <p className="text-slate-400 text-xs mt-0.5">Générées à la livraison d&apos;une commande</p>
      </div>

      <div className="px-6 pt-4 grid grid-cols-2 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
          <p className="text-slate-400 text-xs">En attente de paiement</p>
          <p className="text-blue-400 text-lg font-semibold mt-0.5">{totals.EMISE.toFixed(2)} MAD</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
          <p className="text-slate-400 text-xs">Encaissé</p>
          <p className="text-emerald-400 text-lg font-semibold mt-0.5">{totals.PAYEE.toFixed(2)} MAD</p>
        </div>
      </div>

      <div className="px-6 pt-4 flex flex-col gap-3">
        <input type="text" placeholder="Rechercher réf, commande, client…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        <div className="flex gap-2 flex-wrap">
          {["ALL", ...STATUTS].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                filter === s ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
              }`}>
              {s === "ALL" ? "Toutes" : STATUT_LABEL[s]}
              {s !== "ALL" && <span className="ml-1 opacity-60">({invoices.filter((f) => f.statut === s).length})</span>}
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
        {visible.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucune facture</p>}
        {visible.map((f) => {
          const isOpen = expanded === f.id;
          return (
            <div key={f.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => toggle(f.id)}
                className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-white text-sm font-medium">{f.reference}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[f.statut]}`}>
                      {STATUT_LABEL[f.statut]}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs truncate">
                    {f.commande.client.nom} · Cmd {f.commande.reference}
                    {" · "}{f.issued_at ? new Date(f.issued_at).toLocaleDateString("fr-FR") : new Date(f.createdAt).toLocaleDateString("fr-FR")}
                    {" · "}<span className="text-indigo-300">{f.total_ttc.toFixed(2)} MAD TTC</span>
                  </p>
                </div>
                <span className="text-slate-400 text-sm mt-0.5">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 px-4 py-3 flex flex-col gap-3">
                  {loadingDetail && <p className="text-slate-400 text-xs">Chargement…</p>}
                  {detail && detail.id === f.id && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs mb-0.5">Facturé à</p>
                          <p className="text-white">{detail.commande.client.nom}</p>
                          {detail.commande.client.ville && <p className="text-slate-400 text-xs">{detail.commande.client.ville}</p>}
                          {detail.commande.client.telephone && <p className="text-slate-400 text-xs">{detail.commande.client.telephone}</p>}
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs mb-0.5">Montants</p>
                          <p className="text-slate-300 text-xs">HT : <span className="text-white">{detail.total_ht.toFixed(2)} MAD</span></p>
                          <p className="text-slate-300 text-xs">TVA 20% : <span className="text-white">{(detail.total_ttc - detail.total_ht).toFixed(2)} MAD</span></p>
                          <p className="text-slate-300 text-xs">TTC : <span className="text-indigo-300 font-semibold">{detail.total_ttc.toFixed(2)} MAD</span></p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-2 border-t border-slate-700">
                        {detail.commande.items.map((item) => {
                          const pu = item.final_price ?? item.prixUnitaire;
                          return (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <p className="text-slate-300">{item.product.nom} × {item.quantite} {item.product.unite}</p>
                              <p className="text-indigo-300">{(pu * item.quantite).toFixed(2)} MAD</p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-2 border-t border-slate-700 flex flex-wrap gap-2">
                        <button onClick={() => openPdf(f.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200">
                          📄 Voir PDF
                        </button>
                        {f.statut === "EMISE" && (
                          <button onClick={() => changeStatut(f.id, "PAYEE")} disabled={updating === f.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/70 text-emerald-300 disabled:opacity-50">
                            ✓ Marquer payée
                          </button>
                        )}
                        {f.statut === "PAYEE" && (
                          <button onClick={() => changeStatut(f.id, "EMISE")} disabled={updating === f.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50">
                            ↩ Ré-ouvrir
                          </button>
                        )}
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
