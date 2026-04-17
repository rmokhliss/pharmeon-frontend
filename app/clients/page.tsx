"use client";
import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Client = {
  id: number;
  nom: string;
  type: string;
  telephone?: string;
  ville?: string;
  adresse?: string;
  actif: boolean;
};

const TYPES = ["PHARMACIE", "PARA", "PARTICULIER"];

const emptyForm = { nom: "", type: "PHARMACIE", telephone: "", ville: "", adresse: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const q = filter ? `?search=${encodeURIComponent(filter)}` : "";
    fetch(`${API}/clients${q}`).then((r) => r.json()).then(setClients);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setError(""); setModal(true); };
  const openEdit = (c: Client) => {
    setEditTarget(c);
    setForm({ nom: c.nom, type: c.type, telephone: c.telephone || "", ville: c.ville || "", adresse: c.adresse || "" });
    setError("");
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const url = editTarget ? `${API}/clients/${editTarget.id}` : `${API}/clients`;
      const res = await fetch(url, {
        method: editTarget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, telephone: form.telephone || undefined, ville: form.ville || undefined, adresse: form.adresse || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Erreur"); }
      setModal(false);
      load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Supprimer ce client ?")) return;
    await fetch(`${API}/clients/${id}`, { method: "DELETE" });
    load();
  };

  const typeColor: Record<string, string> = {
    PHARMACIE: "text-blue-400 bg-blue-500/10",
    PARA: "text-purple-400 bg-purple-500/10",
    PARTICULIER: "text-slate-400 bg-slate-500/10",
  };

  const visible = typeFilter === "ALL" ? clients : clients.filter((c) => c.type === typeFilter);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <p className="text-white font-medium">Clients</p>
        <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
          + Nouveau
        </button>
      </div>

      <div className="px-6 pt-4 flex flex-col gap-3">
        <input
          type="text" placeholder="Rechercher..." value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-2 flex-wrap">
          {["ALL", ...TYPES].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                typeFilter === t ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
              }`}>
              {t === "ALL" ? "Tous" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 flex flex-col gap-3">
        {visible.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">Aucun client trouvé</p>
        )}
        {visible.map((c) => (
          <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-medium text-sm truncate">{c.nom}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[c.type] || "text-slate-400 bg-slate-700"}`}>{c.type}</span>
              </div>
              <div className="text-slate-400 text-xs space-y-0.5">
                {c.telephone && <p>📞 {c.telephone}</p>}
                {c.ville && <p>📍 {c.ville}</p>}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit(c)} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">Éditer</button>
              <button onClick={() => remove(c.id)} className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-800/60 text-red-400">Suppr.</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <h2 className="text-white font-semibold">{editTarget ? "Modifier le client" : "Nouveau client"}</h2>
            <form onSubmit={save} className="flex flex-col gap-3">
              <input required placeholder="Nom *" value={form.nom} onChange={(e) => set("nom", e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="Téléphone" value={form.telephone} onChange={(e) => set("telephone", e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              <input placeholder="Ville" value={form.ville} onChange={(e) => set("ville", e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              <input placeholder="Adresse" value={form.adresse} onChange={(e) => set("adresse", e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
                  {saving ? "..." : editTarget ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
