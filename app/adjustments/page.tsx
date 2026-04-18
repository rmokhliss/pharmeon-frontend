"use client";
import { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/admin-auth";

type Product = { id: number; nom: string; reference: string; unite: string; cost_price?: number; prix_achat: number; stock: number };
type AdjItem = { id: number; quantite: number; cost_price: number; product: { nom: string; reference: string; unite?: string } };
type Adj = {
  id: number;
  reference: string;
  type: string;
  statut: string;
  note?: string;
  createdAt: string;
  items: AdjItem[];
};

const TYPES = ["EXPIRATION", "CASSE", "DOMMAGE", "PERTE", "RETOUR"];
const STATUTS = ["EN_ATTENTE", "VALIDEE", "REJETEE"];

const TYPE_LABEL: Record<string, string> = {
  EXPIRATION: "Expiration", CASSE: "Casse", DOMMAGE: "Dommage", PERTE: "Perte", RETOUR: "Retour",
};

const TYPE_COLOR: Record<string, string> = {
  EXPIRATION: "text-amber-400 bg-amber-500/10",
  CASSE: "text-red-400 bg-red-500/10",
  DOMMAGE: "text-orange-400 bg-orange-500/10",
  PERTE: "text-rose-400 bg-rose-500/10",
  RETOUR: "text-emerald-400 bg-emerald-500/10",
};

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente", VALIDEE: "Validée", REJETEE: "Rejetée",
};

const STATUT_COLOR: Record<string, string> = {
  EN_ATTENTE: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  VALIDEE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  REJETEE: "text-red-400 bg-red-500/10 border-red-500/20",
};

type DraftItem = { productId: number | ""; quantite: number; cost_price: number };

export default function AdjustmentsPage() {
  const [adjs, setAdjs] = useState<Adj[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statutFilter, setStatutFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<{ type: string; note: string; items: DraftItem[] }>({
    type: "EXPIRATION", note: "", items: [{ productId: "", quantite: 1, cost_price: 0 }],
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminFetch<Adj[]>("/adjustments").then(setAdjs).catch((e) => setError(e.message));
    adminFetch<Product[]>("/products").then(setProducts).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: number, action: "validate" | "reject") => {
    setWorking(id); setError("");
    try {
      await adminFetch(`/adjustments/${id}/${action}`, { method: "PATCH" });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setWorking(null); }
  };

  const openCreate = () => {
    setForm({ type: "EXPIRATION", note: "", items: [{ productId: "", quantite: 1, cost_price: 0 }] });
    setError("");
    setModal(true);
  };

  const setItem = (idx: number, patch: Partial<DraftItem>) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, ...patch } : it) }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { productId: "", quantite: 1, cost_price: 0 }] }));
  const rmItem = (idx: number) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const onProductChange = (idx: number, pid: number | "") => {
    const p = products.find((x) => x.id === pid);
    setItem(idx, { productId: pid, cost_price: p?.cost_price ?? p?.prix_achat ?? 0 });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const items = form.items.filter((it) => it.productId && it.quantite > 0);
    if (!items.length) { setError("Au moins une ligne valide"); return; }
    setSaving(true);
    try {
      await adminFetch("/adjustments", {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          note: form.note || undefined,
          items: items.map((it) => ({ productId: it.productId, quantite: Number(it.quantite), cost_price: Number(it.cost_price) })),
        }),
      });
      setModal(false);
      load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const visible = adjs.filter((a) => {
    if (statutFilter !== "ALL" && a.statut !== statutFilter) return false;
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    return true;
  });

  const lossTotal = (a: Adj) => a.items.reduce((s, i) => s + i.cost_price * i.quantite, 0);
  const draftTotal = form.items.reduce((s, i) => s + Number(i.cost_price || 0) * Number(i.quantite || 0), 0);

  const totalsByType = TYPES.reduce<Record<string, number>>((m, t) => {
    m[t] = adjs.filter((a) => a.type === t && a.statut === "VALIDEE").reduce((s, a) => s + lossTotal(a), 0);
    return m;
  }, {});

  const productStock = (pid: number | "") => {
    if (!pid) return null;
    return products.find((p) => p.id === pid)?.stock ?? null;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">Ajustements de stock</p>
          <p className="text-slate-400 text-xs mt-0.5">Péremption, casse, perte, retour — validation ajuste le stock</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
          + Nouveau
        </button>
      </div>

      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {TYPES.map((t) => (
          <div key={t} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
            <p className={`text-xs font-medium ${TYPE_COLOR[t].split(" ")[0]}`}>{TYPE_LABEL[t]}</p>
            <p className="text-white text-sm font-semibold mt-0.5">{totalsByType[t].toFixed(2)}</p>
            <p className="text-slate-500 text-[10px]">MAD validés</p>
          </div>
        ))}
      </div>

      <div className="px-6 pt-4 flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          {["ALL", ...STATUTS].map((s) => (
            <button key={s} onClick={() => setStatutFilter(s)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                statutFilter === s ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
              }`}>
              {s === "ALL" ? "Tous statuts" : STATUT_LABEL[s]}
              {s !== "ALL" && <span className="ml-1 opacity-60">({adjs.filter((a) => a.statut === s).length})</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", ...TYPES].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                typeFilter === t ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"
              }`}>
              {t === "ALL" ? "Tous types" : TYPE_LABEL[t]}
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
        {visible.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucun ajustement</p>}
        {visible.map((a) => {
          const isOpen = expanded === a.id;
          const sign = a.type === "RETOUR" ? "+" : "−";
          return (
            <div key={a.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : a.id)}
                className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-white text-sm font-medium">{a.reference}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[a.type] || "text-slate-400 bg-slate-500/10"}`}>
                      {TYPE_LABEL[a.type] || a.type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[a.statut]}`}>
                      {STATUT_LABEL[a.statut]}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    {a.items.length} ligne{a.items.length > 1 ? "s" : ""}
                    {" · "}{new Date(a.createdAt).toLocaleDateString("fr-FR")}
                    {" · "}<span className="text-indigo-300">{sign}{lossTotal(a).toFixed(2)} MAD</span>
                  </p>
                </div>
                <span className="text-slate-400 text-sm mt-0.5">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 px-4 py-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    {a.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <p className="text-slate-300">{item.product.nom} × {item.quantite}</p>
                        <p className="text-indigo-300">{(item.cost_price * item.quantite).toFixed(2)} MAD</p>
                      </div>
                    ))}
                    {a.note && <p className="text-slate-400 text-xs italic mt-1">Note : {a.note}</p>}
                  </div>
                  {a.statut === "EN_ATTENTE" && (
                    <div className="pt-2 border-t border-slate-700 flex gap-2">
                      <button onClick={() => act(a.id, "validate")} disabled={working === a.id}
                        className="flex-1 text-sm px-3 py-2 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/70 text-emerald-300 font-medium disabled:opacity-50">
                        ✓ Valider (ajuster stock)
                      </button>
                      <button onClick={() => act(a.id, "reject")} disabled={working === a.id}
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Nouvel ajustement</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>

            <form onSubmit={save} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Type *</label>
                <select required value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                  {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
                <p className="text-slate-500 text-[11px] mt-1">
                  {form.type === "RETOUR" ? "Entrée en stock à la validation" : "Sortie de stock à la validation"}
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Note</label>
                <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Lot périmé mars 2026…"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400">Lignes *</label>
                  <button type="button" onClick={addItem}
                    className="text-xs px-2 py-1 rounded bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300">+ Ligne</button>
                </div>
                <div className="flex flex-col gap-2">
                  {form.items.map((it, idx) => {
                    const stk = productStock(it.productId);
                    return (
                      <div key={idx} className="bg-slate-900 rounded-lg p-2 flex flex-col gap-1">
                        <div className="grid grid-cols-12 gap-2 items-center">
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
                          <input type="number" step="0.01" min="0" value={it.cost_price}
                            onChange={(e) => setItem(idx, { cost_price: Number(e.target.value) })}
                            placeholder="PA"
                            className="col-span-3 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                          <button type="button" onClick={() => rmItem(idx)} disabled={form.items.length === 1}
                            className="col-span-1 text-red-400 hover:text-red-300 disabled:opacity-30 text-lg">×</button>
                        </div>
                        {stk !== null && form.type !== "RETOUR" && it.quantite > stk && (
                          <p className="text-amber-400 text-[11px]">⚠ Stock actuel : {stk} (ajustement supérieur)</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-right text-sm">
                <span className="text-slate-400">Valeur totale : </span>
                <span className="text-white font-semibold">{draftTotal.toFixed(2)} MAD</span>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
                  {saving ? "..." : "Créer (en attente)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
