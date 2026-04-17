"use client";
import { Product } from "@/app/products/page";

type Props = {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ProductCard({ product, onEdit, onDelete }: Props) {
  const margin = product.prix_vente > 0
    ? Math.round(((product.prix_vente - product.prix_achat) / product.prix_vente) * 100)
    : 0;

  const stockStatus =
    product.stock === 0
      ? "bg-red-500/20 text-red-400"
      : product.stock <= product.stock_min
      ? "bg-yellow-500/20 text-yellow-400"
      : "bg-green-500/20 text-green-400";

  const stockLabel =
    product.stock === 0 ? "Rupture" : product.stock <= product.stock_min ? "Stock bas" : "En stock";

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-500/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-indigo-400 font-mono">{product.reference}</p>
          <h3 className="text-sm font-medium text-white leading-tight mt-0.5 line-clamp-2">{product.nom}</h3>
          <p className="text-xs text-slate-400 mt-1">{product.marque}</p>
        </div>
        <span className="shrink-0 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
          {product.categorie}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-slate-400 text-xs">Prix vente</p>
          <p className="text-white font-semibold">{product.prix_vente.toFixed(2)} MAD</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Marge</p>
          <p className="text-emerald-400 font-semibold">{margin}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stockStatus}`}>
          {stockLabel} ({product.stock})
        </span>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-lg transition-colors"
          >
            Éditer
          </button>
          <button
            onClick={onDelete}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg transition-colors"
          >
            Suppr.
          </button>
        </div>
      </div>
    </div>
  );
}
