"use client";
import { useEffect, useState } from "react";
import { Product } from "@/app/products/page";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Movement = {
  id: number;
  type: "ENTREE" | "SORTIE";
  quantite: number;
  note?: string;
  createdAt: string;
  product: { nom: string; reference: string; unite: string };
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, options);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export default function StockPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "ENTREE", productId: "", quantite: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [mvts, prods] = await Promise.all([
        apiFetch<Movement[]>("/stock"),
        apiFetch<Product[]>("/products"),
      ]);
      setMovements(mvts);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch("/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          productId: parseInt(form.productId),
          quantite: parseInt(form.quantite),
          note: form.note || undefined,
        }),
      });
      setForm({ type: "ENTREE", productId: "", quantite: "", note: "" });
      load();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'opération");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="px-6 py-4 border-b border-slate-700">
        <p className="text-slate-400 text-sm font-medium">Mouvements de stock</p>
      </div>

      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Formulaire */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Nouveau mouvement</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Type */}
              <div className="grid grid-cols-2 gap-2">
                {(["ENTREE", "SORTIE"] as const).map((t) => (
                  <button
                    key={t} type="button"
                    onClick={() => set("type", t)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.type === t
                        ? t === "ENTREE"
                          ? "bg-emerald-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    {t === "ENTREE" ? "▲ Entrée" : "▼ Sortie"}
                  </button>
                ))}
              </div>

              {/* Produit */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Produit</label>
                <select
                  value={form.productId}
                  onChange={(e) => set("productId", e.target.value)}
                  required
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choisir un produit...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference} — {p.nom} (stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantité */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Quantité</label>
                <input
                  type="number" min="1" value={form.quantite}
                  onChange={(e) => set("quantite", e.target.value)}
                  required
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Note (optionnel)</label>
                <input
                  type="text" value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                  placeholder={form.type === "ENTREE" ? "Ex: Livraison fournisseur" : "Ex: Commande pharmacie Atlas"}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit" disabled={submitting}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.type === "ENTREE"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                } text-white disabled:opacity-50`}
              >
                {submitting ? "En cours..." : form.type === "ENTREE" ? "Enregistrer entrée" : "Enregistrer sortie"}
              </button>
            </form>
          </div>
        </div>

        {/* Historique */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-white font-semibold">Historique</h2>
              <span className="text-slate-400 text-xs">{movements.length} mouvements</span>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">Aucun mouvement enregistré</p>
            ) : (
              <div className="divide-y divide-slate-700">
                {movements.map((m) => (
                  <div key={m.id} className="px-5 py-3 flex items-center gap-4">
                    <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      m.type === "ENTREE" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {m.type === "ENTREE" ? "▲" : "▼"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{m.product.nom}</p>
                      <p className="text-slate-400 text-xs">{m.note || "—"}</p>
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
      </div>
    </div>
  );
}
