"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";

const API = "/api";

export type Product = {
  id: number;
  reference: string;
  nom: string;
  marque: string;
  categorie: string;
  prix_achat: number;
  prix_vente: number;
  unite: string;
  stock: number;
  stock_min: number;
  description?: string;
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, options);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Product | "new" | null>(null);

  const fetchProducts = async (s: string, cat: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (s) params.set("search", s);
      if (cat) params.set("categorie", cat);
      setProducts(await apiFetch<Product[]>(`/products?${params}`));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiFetch<{ categorie: string }[]>("/products/categories")
      .then((data) => setCategories(data.map((d) => d.categorie)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(search, selectedCat), 300);
    return () => clearTimeout(timer);
  }, [search, selectedCat]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await apiFetch(`/products/${id}`, { method: "DELETE" });
    fetchProducts(search, selectedCat);
  };

  const handleSave = async (data: Partial<Product>) => {
    const isEdit = editTarget !== "new" && editTarget !== null;
    await apiFetch(isEdit ? `/products/${editTarget.id}` : "/products", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditTarget(null);
    fetchProducts(search, selectedCat);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-700">
        <p className="text-slate-400 text-sm font-medium">Catalogue produits</p>
        <button
          onClick={() => setEditTarget("new")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nouveau produit
        </button>
      </div>

      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom, marque, référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          {loading ? "Chargement..." : `${products.length} produit(s)`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => setEditTarget(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {editTarget !== null && (
        <ProductModal
          product={editTarget === "new" ? null : editTarget}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
