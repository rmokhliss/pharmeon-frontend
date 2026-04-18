"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { adminFetch, getAdminToken } from "@/lib/admin-auth";

type Fournisseur = { id: number; nom: string };
type Product = { id: number; nom: string; reference: string; unite: string; prix_achat: number; cost_price?: number };
type POItem = { id: number; quantite: number; prix_achat: number; product: { nom: string; reference: string; unite: string } };
type PO = {
  id: number;
  reference: string;
  statut: string;
  note?: string;
  expected_date?: string;
  createdAt: string;
  fournisseur: { nom: string };
  items: POItem[];
};

const STATUTS = ["BROUILLON", "ENVOYEE", "CONFIRMEE", "LIVREE", "ANNULEE"];

const STATUT_LABEL: Record<string, string> = {
  BROUILLON: "Brouillon", ENVOYEE: "Envoyée", CONFIRMEE: "Confirmée", LIVREE: "Livrée", ANNULEE: "Annulée",
};

const STATUT_COLOR: Record<string, string> = {
  BROUILLON: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  ENVOYEE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  CONFIRMEE: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  LIVREE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  ANNULEE: "text-red-400 bg-red-500/10 border-red-500/20",
};

type DraftItem = { productId: number | ""; quantite: number; prix_achat: number };

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<{ fournisseurId: number | ""; note: string; expected_date: string; items: DraftItem[] }>({
    fournisseurId: "", note: "", expected_date: "", items: [{ productId: "", quantite: 1, prix_achat: 0 }],
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminFetch<PO[]>("/purchase-orders").then(setPos).catch((e) => setError(e.message));
    adminFetch<Fournisseur[]>("/fournisseurs").then(setFournisseurs).catch(() => {});
    adminFetch<Product[]>("/products").then(setProducts).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => filter === "ALL" ? pos : pos.filter((p) => p.statut === filter), [pos, filter]);

  const changeStatut = async (id: number, statut: string) => {
    setUpdating(id); setError("");
    try {
      await adminFetch(`/purchase-orders/${id}/statut`, { method: "PATCH", body: JSON.stringify({ statut }) });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally { setUpdating(null); }
  };

  const remove = async (id: number) => {
    if (!confirm("Supprimer ce brouillon ?")) return;
    setUpdating(id); setError("");
    try {
      await adminFetch(`/purchase-orders/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setUpdating(null); }
  };

  const openPdf = (id: number) => {
    const token = getAdminToken();
    if (!token) { setError("Session expirée"); return; }
    fetch(`/api/purchase-orders/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((b) => { const url = URL.createObjectURL(b); window.open(url, "_blank"); })
      .catch(() => setError("Erreur génération PDF"));
  };

  const openCreate = () => {
    setForm({ fournisseurId: "", note: "", expected_date: "", items: [{ productId: "", quantite: 1, prix_achat: 0 }] });
    setError("");
    setModal(true);
  };

  const setItem = (idx: number, patch: Partial<DraftItem>) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, ...patch } : it) }));

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { productId: "", quantite: 1, prix_achat: 0 }] }));
  const rmItem = (idx: number) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const onProductChange = (idx: number, pid: number | "") => {
    const p = products.find((x) => x.id === pid);
    setItem(idx, { productId: pid, prix_achat: p?.cost_price ?? p?.prix_achat ?? 0 });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fournisseurId) { setError("Fournisseur requis"); return; }
    const items = form.items.filter((it) => it.productId && it.quantite > 0);
    if (!items.length) { setError("Au moins une ligne valide requise"); return; }
    setSaving(true);
    try {
      await adminFetch("/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          fournisseurId: form.fournisseurId,
          note: form.note || undefined,
          expected_date: form.expected_date || undefined,
          items: items.map((it) => ({ productId: it.productId, quantite: Number(it.quantite), prix_achat: Number(it.prix_achat) })),
        }),
      });
      setModal(false);
      load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const total = (po: PO) => po.items.reduce((s, i) => s + i.prix_achat * i.quantite, 0);
  const draftTotal = form.items.reduce((s, i) => s + Number(i.prix_achat || 0) * Number(i.quantite || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">Bons de commande fournisseur</p>
          <p className="text-slate-400 text-xs mt-0.5">Réassort — livraison incrémente le stock à réception</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
          + Nouveau BC
        </button>
      </div>

      <div className="px-6 pt-4 flex gap-2 flex-wrap">
        {["ALL", ...STATUTS].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              filter === s ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
            }`}>
            {s === "ALL" ? "Tous" : STATUT_LABEL[s]}
            {s !== "ALL" && <span className="ml-1 opacity-60">({pos.filter((p) => p.statut === s).length})</span>}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-6 pt-3">
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        </div>
      )}

      <div className="px-6 py-4 flex flex-col gap-3">
        {visible.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucun bon de commande</p>}
        {visible.map((po) => {
          const isOpen = expanded === po.id;
          return (
            <div key={po.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : po.id)}
                className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-white text-sm font-medium">{po.reference}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[po.statut]}`}>
                      {STATUT_LABEL[po.statut]}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    {po.fournisseur.nom} · {new Date(po.createdAt).toLocaleDateString("fr-FR")}
                    {po.expected_date && ` · Livr. ${new Date(po.expected_date).toLocaleDateString("fr-FR")}`}
                    {" · "}<span className="text-indigo-300">{total(po).toFixed(2)} MAD</span>
                  </p>
                </div>
                <span className="text-slate-400 text-sm mt-0.5">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 px-4 py-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    {po.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <p className="text-slate-300">{item.product.nom} × {item.quantite} {item.product.unite}</p>
                        <p className="text-indigo-300">{(item.prix_achat * item.quantite).toFixed(2)} MAD</p>
                      </div>
                    ))}
                    {po.note && <p className="text-slate-400 text-xs italic mt-1">Note : {po.note}</p>}
                  </div>

                  <div className="pt-2 border-t border-slate-700 flex flex-wrap gap-2">
                    <button onClick={() => openPdf(po.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200">
                      📄 Voir PDF
                    </button>
                    {STATUTS.filter((s) => s !== po.statut).map((s) => (
                      <button key={s} onClick={() => changeStatut(po.id, s)} disabled={updating === po.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50">
                        → {STATUT_LABEL[s]}
                      </button>
                    ))}
                    {po.statut === "BROUILLON" && (
                      <button onClick={() => remove(po.id)} disabled={updating === po.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-400 disabled:opacity-50 ml-auto">
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Nouveau bon de commande</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>

            <form onSubmit={save} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fournisseur *</label>
                <select required value={form.fournisseurId}
                  onChange={(e) => setForm((f) => ({ ...f, fournisseurId: e.target.value ? Number(e.target.value) : "" }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="">Sélectionner…</option>
                  {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Livraison prévue</label>
                  <input type="date" value={form.expected_date}
                    onChange={(e) => setForm((f) => ({ ...f, expected_date: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Note</label>
                  <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Réassort trimestriel…"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400">Lignes *</label>
                  <button type="button" onClick={addItem}
                    className="text-xs px-2 py-1 rounded bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300">+ Ligne</button>
                </div>
                <div className="flex flex-col gap-2">
                  {form.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-900 rounded-lg p-2">
                      <select value={it.productId}
                        onChange={(e) => onProductChange(idx, e.target.value ? Number(e.target.value) : "")}
                        className="col-span-6 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                        <option value="">Produit…</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                      <input type="number" min="1" value={it.quantite}
                        onChange={(e) => setItem(idx, { quantite: Number(e.target.value) })}
                        placeholder="Qté"
                        className="col-span-2 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                      <input type="number" step="0.01" min="0" value={it.prix_achat}
                        onChange={(e) => setItem(idx, { prix_achat: Number(e.target.value) })}
                        placeholder="PU HT"
                        className="col-span-3 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                      <button type="button" onClick={() => rmItem(idx)} disabled={form.items.length === 1}
                        className="col-span-1 text-red-400 hover:text-red-300 disabled:opacity-30 text-lg">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right text-sm">
                <span className="text-slate-400">Total HT : </span>
                <span className="text-white font-semibold">{draftTotal.toFixed(2)} MAD</span>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
                  {saving ? "..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
