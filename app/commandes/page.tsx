"use client";
import { useEffect, useState, useCallback } from "react";
import { adminFetch, getAdminToken } from "@/lib/admin-auth";

type CommandeItem = {
  id: number;
  quantite: number;
  prixUnitaire: number;
  final_price?: number;
  original_price?: number;
  product: { nom: string; reference?: string; unite?: string };
};

type Commande = {
  id: number;
  reference: string;
  statut: string;
  createdAt: string;
  note?: string;
  client: { nom: string; ville?: string; type: string; role?: string };
  items: CommandeItem[];
};

type ProductLite = {
  id: number;
  nom: string;
  reference: string;
  prix_vente: number;
  retail_price?: number;
  wholesale_price?: number;
  stock: number;
};

type Livreur = { id: number; nom: string; vehicule?: string };

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
  const [error, setError] = useState("");
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [deliverModal, setDeliverModal] = useState<Commande | null>(null);
  const [delivForm, setDelivForm] = useState({ livreurId: "", delivery_date: "", tracking_number: "" });

  const load = useCallback(() => {
    adminFetch<Commande[]>("/commandes").then(setCommandes).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminFetch<Livreur[]>("/livreurs").then(setLivreurs).catch(() => {});
  }, []);

  useEffect(() => {
    if (addingTo === null) return;
    const t = setTimeout(() => {
      const q = productSearch ? `?search=${encodeURIComponent(productSearch)}` : "";
      adminFetch<ProductLite[]>(`/products${q}`).then((list) => setProducts(list.slice(0, 20))).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [addingTo, productSearch]);

  const isEditable = (c: Commande) => c.statut !== "LIVREE" && c.statut !== "ANNULEE";

  const changeStatut = async (id: number, statut: string, extra?: { livreurId?: number; delivery_date?: string; tracking_number?: string }) => {
    setUpdating(id); setError("");
    try {
      await adminFetch(`/commandes/${id}/statut`, {
        method: "PATCH",
        body: JSON.stringify({ statut, ...extra }),
      });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setUpdating(null); }
  };

  const openDeliverModal = (c: Commande) => {
    setDelivForm({ livreurId: "", delivery_date: new Date().toISOString().slice(0, 10), tracking_number: "" });
    setDeliverModal(c);
    setError("");
  };

  const openPdf = (id: number) => {
    const token = getAdminToken();
    if (!token) { setError("Session expirée"); return; }
    fetch(`/api/commandes/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((b) => { const url = URL.createObjectURL(b); window.open(url, "_blank"); })
      .catch(() => setError("Erreur génération PDF"));
  };

  const confirmDeliver = async () => {
    if (!deliverModal) return;
    const extra: { livreurId?: number; delivery_date?: string; tracking_number?: string } = {};
    if (delivForm.livreurId) extra.livreurId = Number(delivForm.livreurId);
    if (delivForm.delivery_date) extra.delivery_date = delivForm.delivery_date;
    if (delivForm.tracking_number) extra.tracking_number = delivForm.tracking_number;
    const id = deliverModal.id;
    setDeliverModal(null);
    await changeStatut(id, "LIVREE", extra);
  };

  const updateQty = async (c: Commande, itemId: number, quantite: number) => {
    if (quantite < 1) return;
    setError("");
    try {
      await adminFetch(`/commandes/${c.id}/items/${itemId}/quantity`, {
        method: "PATCH", body: JSON.stringify({ quantite }),
      });
      load();
    } catch (e: any) { setError(e.message); }
  };

  const updatePrice = async (c: Commande, itemId: number, final_price: number) => {
    if (final_price <= 0) return;
    setError("");
    try {
      await adminFetch(`/commandes/${c.id}/items/${itemId}/price`, {
        method: "PATCH", body: JSON.stringify({ final_price }),
      });
      load();
    } catch (e: any) { setError(e.message); }
  };

  const removeItem = async (c: Commande, itemId: number) => {
    if (!confirm("Retirer cet article ?")) return;
    setError("");
    try {
      await adminFetch(`/commandes/${c.id}/items/${itemId}`, { method: "DELETE" });
      load();
    } catch (e: any) { setError(e.message); }
  };

  const addProduct = async (c: Commande, productId: number) => {
    setError("");
    try {
      await adminFetch(`/commandes/${c.id}/items`, {
        method: "POST", body: JSON.stringify({ productId, quantite: 1 }),
      });
      setAddingTo(null);
      setProductSearch("");
      load();
    } catch (e: any) { setError(e.message); }
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

      {error && (
        <div className="px-6 pt-3">
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        </div>
      )}

      <div className="px-6 py-4 flex flex-col gap-3">
        {visible.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucune commande</p>}
        {visible.map((c) => {
          const total = c.items.reduce((s, i) => s + (i.final_price ?? i.prixUnitaire) * i.quantite, 0);
          const isOpen = expanded === c.id;
          const editable = isEditable(c);
          return (
            <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : c.id)} className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-white text-sm font-medium">{c.reference}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[c.statut]}`}>
                      {STATUT_LABEL[c.statut]}
                    </span>
                    {c.client.role === "PRO" && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300">PRO</span>}
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
                  <div className="flex flex-col gap-2">
                    {c.items.map((item) => {
                      const unit = item.final_price ?? item.prixUnitaire;
                      const line = unit * item.quantite;
                      return (
                        <div key={item.id} className="bg-slate-900 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                          <p className="text-slate-200 text-sm flex-1 min-w-0 truncate">{item.product.nom}</p>
                          {editable ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500 text-[10px] uppercase">Qté</span>
                                <input type="number" min={1} defaultValue={item.quantite}
                                  onBlur={(e) => {
                                    const n = Number(e.target.value);
                                    if (n !== item.quantite) updateQty(c, item.id, n);
                                  }}
                                  className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-indigo-500" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500 text-[10px] uppercase">PU</span>
                                <input type="number" step="0.01" min={0.01} defaultValue={unit.toFixed(2)}
                                  onBlur={(e) => {
                                    const n = Number(e.target.value);
                                    if (Math.abs(n - unit) > 0.001) updatePrice(c, item.id, n);
                                  }}
                                  className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-indigo-500" />
                              </div>
                              <span className="text-indigo-300 text-sm font-medium w-24 text-right">{line.toFixed(2)} MAD</span>
                              <button onClick={() => removeItem(c, item.id)}
                                className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-800/60 text-red-400">✕</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs">× {item.quantite} @ {unit.toFixed(2)}</span>
                              <span className="text-indigo-300 text-sm font-medium w-24 text-right">{line.toFixed(2)} MAD</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {editable && (
                    <div>
                      {addingTo === c.id ? (
                        <div className="bg-slate-900 rounded-lg p-3 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input type="text" autoFocus placeholder="Rechercher un produit…" value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                            <button onClick={() => { setAddingTo(null); setProductSearch(""); }}
                              className="text-xs px-2 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">Annuler</button>
                          </div>
                          <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
                            {products.length === 0 && <p className="text-slate-500 text-xs text-center py-2">Aucun résultat</p>}
                            {products.map((p) => (
                              <button key={p.id} onClick={() => addProduct(c, p.id)}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-left">
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-200 text-sm truncate">{p.nom}</p>
                                  <p className="text-slate-500 text-[11px]">{p.reference} · stock {p.stock}</p>
                                </div>
                                <p className="text-indigo-300 text-xs font-medium flex-shrink-0">
                                  {(p.wholesale_price || p.retail_price || p.prix_vente).toFixed(2)} MAD
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingTo(c.id); setProductSearch(""); }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300">+ Ajouter un article</button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <span className="text-slate-400 text-xs">Total</span>
                    <span className="text-white font-semibold">{total.toFixed(2)} MAD</span>
                  </div>

                  <button onClick={() => openPdf(c.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 self-start">
                    📄 BC (PDF)
                  </button>

                  {c.note && <p className="text-slate-400 text-xs italic">Note : {c.note}</p>}

                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Changer le statut :</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUTS.filter((s) => s !== c.statut).map((s) => (
                        <button
                          key={s}
                          onClick={() => s === "LIVREE" ? openDeliverModal(c) : changeStatut(c.id, s)}
                          disabled={updating === c.id}
                          className={`text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors ${
                            s === "LIVREE"
                              ? "bg-emerald-700/40 hover:bg-emerald-700/70 text-emerald-300"
                              : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                          }`}>
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

      {deliverModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-white font-semibold">Marquer comme livrée</h2>
              <p className="text-slate-400 text-xs mt-0.5">{deliverModal.reference} · {deliverModal.client.nom}</p>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Livreur</label>
                <select value={delivForm.livreurId}
                  onChange={(e) => setDelivForm((f) => ({ ...f, livreurId: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="">— Non assigné —</option>
                  {livreurs.map((l) => (
                    <option key={l.id} value={l.id}>{l.nom}{l.vehicule ? ` (${l.vehicule})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date de livraison</label>
                <input type="date" value={delivForm.delivery_date}
                  onChange={(e) => setDelivForm((f) => ({ ...f, delivery_date: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">N° suivi (optionnel)</label>
                <input type="text" value={delivForm.tracking_number}
                  onChange={(e) => setDelivForm((f) => ({ ...f, tracking_number: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeliverModal(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">Annuler</button>
              <button onClick={confirmDeliver}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">
                Confirmer livraison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
