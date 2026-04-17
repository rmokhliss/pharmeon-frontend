"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/app/products/page";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Props = { type: "ENTREE" | "SORTIE" };
type Tiers = { id: number; nom: string };

export default function StockForm({ type }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [form, setForm] = useState({ productId: "", quantite: "", note: "", tiersId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEntree = type === "ENTREE";

  useEffect(() => {
    fetch(`${API}/products`).then((r) => r.json()).then(setProducts);
    const endpoint = isEntree ? "fournisseurs" : "clients";
    fetch(`${API}/${endpoint}`).then((r) => r.json()).then(setTiers);
  }, [isEntree]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selected = products.find((p) => p.id === parseInt(form.productId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        productId: parseInt(form.productId),
        quantite: parseInt(form.quantite),
        note: form.note || undefined,
      };
      if (form.tiersId) {
        if (isEntree) body.fournisseurId = parseInt(form.tiersId);
        else body.clientId = parseInt(form.tiersId);
      }
      const res = await fetch(`${API}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur serveur");
      }
      setSuccess("Opération enregistrée ✓");
      setForm({ productId: "", quantite: "", note: "", tiersId: "" });
      setTimeout(() => router.push("/stock/log"), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const accent = isEntree ? "emerald" : "red";

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold bg-${accent}-500/20 text-${accent}-400`}>
          {isEntree ? "▲" : "▼"}
        </span>
        <p className="text-white font-medium">{isEntree ? "Entrée de stock" : "Sortie de stock"}</p>
      </div>

      <div className="px-6 py-6 max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="block text-xs text-slate-400 mb-1">Produit</label>
            <select value={form.productId} onChange={(e) => set("productId", e.target.value)} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="">Choisir un produit...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>[{p.reference}] {p.nom}</option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Stock actuel</span>
              <span className={`text-sm font-semibold ${
                selected.stock === 0 ? "text-red-400"
                : selected.stock <= selected.stock_min ? "text-yellow-400"
                : "text-emerald-400"
              }`}>{selected.stock} {selected.unite}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Quantité</label>
            <input type="number" min="1" value={form.quantite}
              onChange={(e) => set("quantite", e.target.value)} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="0" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {isEntree ? "Fournisseur (optionnel)" : "Client (optionnel)"}
            </label>
            <select value={form.tiersId} onChange={(e) => set("tiersId", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="">{isEntree ? "Choisir un fournisseur..." : "Choisir un client..."}</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Note (optionnel)</label>
            <input type="text" value={form.note} onChange={(e) => set("note", e.target.value)}
              placeholder={isEntree ? "Ex: Livraison NUXE ref #1234" : "Ex: Commande pharmacie centrale"}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 text-sm">{success}</div>
          )}

          <button type="submit" disabled={submitting}
            className={`py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
              isEntree ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
            } text-white`}>
            {submitting ? "Enregistrement..." : isEntree ? "▲ Enregistrer l'entrée" : "▼ Enregistrer la sortie"}
          </button>
        </form>
      </div>
    </div>
  );
}
