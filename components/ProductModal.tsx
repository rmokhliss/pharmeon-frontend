"use client";
import { useState, useEffect } from "react";
import { Product } from "@/app/products/page";

type Props = {
  product: Product | null;
  categories: string[];
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
};

const emptyForm = {
  reference: "",
  nom: "",
  marque: "",
  categorie: "",
  prix_achat: "",
  prix_vente: "",
  cost_price: "",
  retail_price: "",
  wholesale_price: "",
  retail_discount_pct: "0",
  wholesale_discount_pct: "0",
  unite: "Pièce",
  stock: "0",
  stock_min: "5",
  description: "",
  image_url: "",
};

export default function ProductModal({ product, categories, onSave, onClose }: Props) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (product) {
      setForm({
        reference: product.reference,
        nom: product.nom,
        marque: product.marque,
        categorie: product.categorie,
        prix_achat: String(product.prix_achat ?? ""),
        prix_vente: String(product.prix_vente ?? ""),
        cost_price: product.cost_price != null ? String(product.cost_price) : String(product.prix_achat ?? ""),
        retail_price: product.retail_price != null ? String(product.retail_price) : String(product.prix_vente ?? ""),
        wholesale_price: product.wholesale_price != null ? String(product.wholesale_price) : String(product.prix_vente ?? ""),
        retail_discount_pct: String(product.retail_discount_pct ?? 0),
        wholesale_discount_pct: String(product.wholesale_discount_pct ?? 0),
        unite: product.unite,
        stock: String(product.stock),
        stock_min: String(product.stock_min),
        description: product.description || "",
        image_url: product.image_url || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [product]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toNum = (v: string) => (v === "" ? undefined : parseFloat(v));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prix_achat = parseFloat(form.prix_achat);
    const prix_vente = parseFloat(form.prix_vente);
    onSave({
      reference: form.reference,
      nom: form.nom,
      marque: form.marque,
      categorie: form.categorie,
      prix_achat,
      prix_vente,
      cost_price: toNum(form.cost_price) ?? prix_achat,
      retail_price: toNum(form.retail_price) ?? prix_vente,
      wholesale_price: toNum(form.wholesale_price) ?? prix_vente,
      retail_discount_pct: toNum(form.retail_discount_pct) ?? 0,
      wholesale_discount_pct: toNum(form.wholesale_discount_pct) ?? 0,
      unite: form.unite,
      stock: parseInt(form.stock),
      stock_min: parseInt(form.stock_min),
      description: form.description || undefined,
      image_url: form.image_url || undefined,
    });
  };

  const retailNet = (() => {
    const p = parseFloat(form.retail_price);
    const d = parseFloat(form.retail_discount_pct);
    if (isNaN(p)) return null;
    return Math.round(p * (1 - (isNaN(d) ? 0 : d) / 100) * 100) / 100;
  })();

  const wholesaleNet = (() => {
    const p = parseFloat(form.wholesale_price);
    const d = parseFloat(form.wholesale_discount_pct);
    if (isNaN(p)) return null;
    return Math.round(p * (1 - (isNaN(d) ? 0 : d) / 100) * 100) / 100;
  })();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h2 className="text-white font-semibold">
            {product ? "Modifier le produit" : "Nouveau produit"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <section className="flex flex-col gap-3">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Identité</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Référence" value={form.reference} onChange={(v) => set("reference", v)} required disabled={!!product} />
              <Field label="Marque" value={form.marque} onChange={(v) => set("marque", v)} required />
            </div>
            <Field label="Nom du produit" value={form.nom} onChange={(v) => set("nom", v)} required />
            <div>
              <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
              <input
                list="cats" value={form.categorie} onChange={(e) => set("categorie", e.target.value)} required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
          </section>

          <section className="flex flex-col gap-3 pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Image</p>
            <Field label="URL de l'image (https://…)" value={form.image_url} onChange={(v) => set("image_url", v)} type="url" />
            {form.image_url && (
              <div className="flex items-center justify-center bg-slate-900 border border-slate-700 rounded-lg p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="Aperçu" className="max-h-40 rounded object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3 pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Prix</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix achat par défaut (MAD)" value={form.prix_achat} onChange={(v) => set("prix_achat", v)} type="number" required />
              <Field label="Prix vente par défaut (MAD)" value={form.prix_vente} onChange={(v) => set("prix_vente", v)} type="number" required />
            </div>
            <p className="text-[11px] text-slate-500 -mt-1">Les champs ci-dessous affinent le pricing par rôle. Vides → utilisent les valeurs par défaut.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col gap-2">
                <p className="text-xs text-indigo-400 font-medium">Client public (retail)</p>
                <Field label="Prix retail (MAD)" value={form.retail_price} onChange={(v) => set("retail_price", v)} type="number" />
                <Field label="Remise retail (%)" value={form.retail_discount_pct} onChange={(v) => set("retail_discount_pct", v)} type="number" />
                {retailNet !== null && (
                  <p className="text-xs text-slate-400">Prix net client : <span className="text-white">{retailNet.toFixed(2)} MAD</span></p>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col gap-2">
                <p className="text-xs text-emerald-400 font-medium">Pro (wholesale)</p>
                <Field label="Prix pro (MAD)" value={form.wholesale_price} onChange={(v) => set("wholesale_price", v)} type="number" />
                <Field label="Remise pro (%)" value={form.wholesale_discount_pct} onChange={(v) => set("wholesale_discount_pct", v)} type="number" />
                {wholesaleNet !== null && (
                  <p className="text-xs text-slate-400">Prix net pro : <span className="text-white">{wholesaleNet.toFixed(2)} MAD</span></p>
                )}
              </div>
            </div>

            <Field label="Coût réel (cost_price, MAD) — pour l'analyse de marge" value={form.cost_price} onChange={(v) => set("cost_price", v)} type="number" />
          </section>

          <section className="flex flex-col gap-3 pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Stock</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Unité" value={form.unite} onChange={(v) => set("unite", v)} required />
              <Field label="Stock" value={form.stock} onChange={(v) => set("stock", v)} type="number" required />
              <Field label="Stock min" value={form.stock_min} onChange={(v) => set("stock_min", v)} type="number" required />
            </div>
          </section>

          <section className="flex flex-col gap-2 pt-2 border-t border-slate-700">
            <label className="block text-xs text-slate-400">Description</label>
            <textarea
              value={form.description} onChange={(e) => set("description", e.target.value)} rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </section>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded-lg transition-colors">
              Annuler
            </button>
            <button type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg transition-colors font-medium">
              {product ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} disabled={disabled}
        step={type === "number" ? "any" : undefined}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
      />
    </div>
  );
}
