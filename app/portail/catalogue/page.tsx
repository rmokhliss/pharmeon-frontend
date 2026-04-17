"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPortailUser, portailFetch, clearPortailSession } from "@/lib/portail-auth";
import Logo from "@/components/Logo";

type Product = { id: number; nom: string; reference: string; marque: string; categorie: string; prix_vente: number; unite: string; stock: number; description?: string };
type CartItem = { product: Product; quantite: number };

export default function CataloguePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getPortailUser();
    if (!u) { router.replace("/portail"); return; }
    setUser(u);
    fetch(`/api/products`)
      .then((r) => r.json()).then(setProducts);
  }, [router]);

  const filtered = products.filter((p) =>
    p.stock > 0 && (p.nom.toLowerCase().includes(search.toLowerCase()) || p.marque.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    setCart((c) => {
      const existing = c.find((i) => i.product.id === product.id);
      if (existing) return c.map((i) => i.product.id === product.id ? { ...i, quantite: i.quantite + 1 } : i);
      return [...c, { product, quantite: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((c) => c.map((i) => i.product.id === id ? { ...i, quantite: Math.max(1, i.quantite + delta) } : i).filter((i) => i.quantite > 0));
  };

  const removeFromCart = (id: number) => setCart((c) => c.filter((i) => i.product.id !== id));

  const total = cart.reduce((s, i) => s + i.product.prix_vente * i.quantite, 0);

  const submitOrder = async () => {
    setSending(true); setError("");
    try {
      await portailFetch("/commandes", {
        method: "POST",
        body: JSON.stringify({ note: note || undefined, items: cart.map((i) => ({ productId: i.product.id, quantite: i.quantite })) }),
      });
      setCart([]); setNote(""); setCartOpen(false);
      setSuccess("Commande envoyée ! Nous vous confirmons dès que possible.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) { setError(err.message); }
    finally { setSending(false); }
  };

  const logout = () => { clearPortailSession(); router.push("/"); };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <div>
            <p className="text-white font-semibold text-sm">Pharmeon</p>
            <p className="text-slate-400 text-xs">Bonjour, {user.nom}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/portail/commandes")}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300">
            Mes commandes
          </button>
          <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300">Déconnexion</button>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        <input type="text" placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />

        {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 text-sm">{success}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const inCart = cart.find((i) => i.product.id === p.id);
            return (
              <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.nom}</p>
                    <p className="text-slate-400 text-xs">{p.marque} · {p.categorie}</p>
                  </div>
                  <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">{p.stock} {p.unite}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-indigo-400 font-semibold">{p.prix_vente.toFixed(2)} MAD</p>
                  {inCart ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(p.id, -1)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm flex items-center justify-center">−</button>
                      <span className="text-white text-sm w-5 text-center">{inCart.quantite}</span>
                      <button onClick={() => updateQty(p.id, 1)} className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm flex items-center justify-center">+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(p)} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                      + Ajouter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-slate-500 text-sm col-span-full text-center py-8">Aucun produit disponible</p>}
        </div>
      </div>

      {/* Floating cart button */}
      {cart.length > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-4 left-4 sm:left-auto sm:w-72 sm:right-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center justify-between transition-colors">
          <span>🛒 Panier ({cart.length} article{cart.length > 1 ? "s" : ""})</span>
          <span>{total.toFixed(2)} MAD</span>
        </button>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-white font-semibold">Mon panier</h2>
              <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{item.product.nom}</p>
                    <p className="text-slate-400 text-xs">{item.product.prix_vente.toFixed(2)} MAD / {item.product.unite}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 rounded bg-slate-700 text-white text-xs flex items-center justify-center">−</button>
                    <span className="text-white text-sm w-6 text-center">{item.quantite}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded bg-slate-700 text-white text-xs flex items-center justify-center">+</button>
                  </div>
                  <p className="text-indigo-300 text-sm w-20 text-right">{(item.product.prix_vente * item.quantite).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-700 flex flex-col gap-3">
              <input placeholder="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total</span>
                <span className="text-white font-bold">{total.toFixed(2)} MAD</span>
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button onClick={submitOrder} disabled={sending}
                className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                {sending ? "Envoi en cours..." : "Passer la commande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
