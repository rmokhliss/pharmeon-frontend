"use client";
import { useState, useEffect } from "react";
import { Product } from "@/app/products/page";

type Props = {
  product: Product | null;
  categories: string[];
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
};

export default function ProductModal({ product, categories, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    reference: "",
    nom: "",
    marque: "",
    categorie: "",
    prix_achat: "",
    prix_vente: "",
    unite: "Pièce",
    stock: "0",
    stock_min: "5",
    description: "",
  });

  useEffect(() => {
    if (product) {
      setForm({
        reference: product.reference,
        nom: product.nom,
        marque: product.marque,
        categorie: product.categorie,
        prix_achat: String(product.prix_achat),
        prix_vente: String(product.prix_vente),
        unite: product.unite,
        stock: String(product.stock),
        stock_min: String(product.stock_min),
        description: product.description || "",
      });
    }
  }, [product]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      prix_achat: parseFloat(form.prix_achat),
      prix_vente: parseFloat(form.prix_vente),
      stock: parseInt(form.stock),
      stock_min: parseInt(form.stock_min),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-white font-semibold">
            {product ? "Modifier le produit" : "Nouveau produit"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Référence" value={form.reference} onChange={(v) => set("reference", v)} required disabled={!!product} />
            <Field label="Marque" value={form.marque} onChange={(v) => set("marque", v)} required />
          </div>

          <Field label="Nom du produit" value={form.nom} onChange={(v) => set("nom", v)} required />

          <div>
            <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
            <input
              list="cats"
              value={form.categorie}
              onChange={(e) => set("categorie", e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <datalist id="cats">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix achat (MAD)" value={form.prix_achat} onChange={(v) => set("prix_achat", v)} type="number" required />
            <Field label="Prix vente (MAD)" value={form.prix_vente} onChange={(v) => set("prix_vente", v)} type="number" required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Unité" value={form.unite} onChange={(v) => set("unite", v)} required />
            <Field label="Stock" value={form.stock} onChange={(v) => set("stock", v)} type="number" required />
            <Field label="Stock min" value={form.stock_min} onChange={(v) => set("stock_min", v)} type="number" required />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

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
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
      />
    </div>
  );
}
