"use client";
import { Product } from "@/app/products/page";

type Props = {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ProductCard({ product, onEdit, onDelete }: Props) {
  const retail = product.retail_price ?? product.prix_vente;
  const retailDiscount = product.retail_discount_pct ?? 0;
  const retailNet = Math.round(retail * (1 - retailDiscount / 100) * 100) / 100;

  const wholesale = product.wholesale_price || retail;
  const wholesaleDiscount = product.wholesale_discount_pct ?? 0;
  const wholesaleNet = Math.round(wholesale * (1 - wholesaleDiscount / 100) * 100) / 100;

  const cost = product.cost_price ?? product.prix_achat;
  const margin = retailNet > 0 ? Math.round(((retailNet - cost) / retailNet) * 100) : 0;

  const { label: stockLabel, className: stockStatus } =
    product.stock === 0
      ? { label: "Rupture",   className: "bg-red-500/20 text-red-400" }
      : product.stock <= product.stock_min
      ? { label: "Stock bas", className: "bg-yellow-500/20 text-yellow-400" }
      : { label: "En stock",  className: "bg-green-500/20 text-green-400" };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden hover:border-indigo-500/50 transition-colors">
      <div className="relative aspect-[4/3] bg-slate-900 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.nom}
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <span className="text-slate-600 text-4xl">📦</span>
        )}
        <span className="absolute top-2 right-2 text-[10px] bg-slate-800/90 text-slate-200 px-2 py-0.5 rounded-full font-medium">
          {product.categorie}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-xs text-indigo-400 font-mono">{product.reference}</p>
          <h3 className="text-sm font-medium text-white leading-tight mt-0.5 line-clamp-2">{product.nom}</h3>
          <p className="text-xs text-slate-400 mt-1">{product.marque}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs">
          <div>
            <p className="text-slate-500">Client</p>
            <p className="text-indigo-300 font-semibold">{retailNet.toFixed(2)} MAD</p>
            {retailDiscount > 0 && <p className="text-slate-500 line-through text-[10px]">{retail.toFixed(2)}</p>}
          </div>
          <div>
            <p className="text-slate-500">Pro</p>
            <p className="text-emerald-300 font-semibold">{wholesaleNet.toFixed(2)} MAD</p>
            {wholesaleDiscount > 0 && <p className="text-slate-500 line-through text-[10px]">{wholesale.toFixed(2)}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Coût </span>
            <span className="text-slate-300">{cost.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">Marge </span>
            <span className="text-emerald-400 font-semibold">{margin}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stockStatus}`}>
            {stockLabel} ({product.stock})
          </span>
          <div className="flex gap-1">
            <button onClick={onEdit}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-lg transition-colors">
              Éditer
            </button>
            <button onClick={onDelete}
              className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg transition-colors">
              Suppr.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
