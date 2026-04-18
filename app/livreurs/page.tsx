"use client";
import { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/admin-auth";

type Livreur = {
  id: number;
  nom: string;
  telephone?: string;
  ville?: string;
  vehicule?: string;
  cin?: string;
  note?: string;
  actif: boolean;
};

const emptyForm = { nom: "", telephone: "", ville: "", vehicule: "", cin: "", note: "" };

export default function LivreursPage() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [filter, setFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Livreur | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const q = filter ? `?search=${encodeURIComponent(filter)}` : "";
    adminFetch<Livreur[]>(`/livreurs${q}`).then(setLivreurs).catch((e) => setError(e.message));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setError(""); setModal(true); };
  const openEdit = (l: Livreur) => {
    setEditTarget(l);
    setForm({
      nom: l.nom,
      telephone: l.telephone || "",
      ville: l.ville || "",
      vehicule: l.vehicule || "",
      cin: l.cin || "",
      note: l.note || "",
    });
    setError("");
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const path = editTarget ? `/livreurs/${editTarget.id}` : `/livreurs`;
      const body: Record<string, string | undefined> = { nom: form.nom };
      for (const k of Object.keys(form) as (keyof typeof form)[]) {
        if (k === "nom") continue;
        body[k] = form[k] || undefined;
      }
      await adminFetch(path, {
        method: editTarget ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setModal(false);
      load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Désactiver ce livreur ?")) return;
    try {
      await adminFetch(`/livreurs/${id}`, { method: "DELETE" });
      load();
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <p className="text-white font-medium">Livreurs</p>
        <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
          + Nouveau
        </button>
      </div>

      {error && (
        <div className="px-6 pt-3">
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        </div>
      )}

      <div className="px-6 pt-4">
        <input
          type="text" placeholder="Rechercher..." value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="px-6 py-4 flex flex-col gap-3">
        {livreurs.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">Aucun livreur</p>
        )}
        {livreurs.map((l) => (
          <div key={l.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate mb-1">{l.nom}</p>
              <div className="text-slate-400 text-xs space-y-0.5">
                {l.telephone && <p>📞 {l.telephone}</p>}
                {l.ville && <p>📍 {l.ville}</p>}
                {l.vehicule && <p>🚚 {l.vehicule}</p>}
                {l.cin && <p>🪪 CIN : {l.cin}</p>}
                {l.note && <p className="italic">« {l.note} »</p>}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit(l)} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">Éditer</button>
              <button onClick={() => remove(l.id)} className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-800/60 text-red-400">Suppr.</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
            <h2 className="text-white font-semibold">{editTarget ? "Modifier le livreur" : "Nouveau livreur"}</h2>
            <form onSubmit={save} className="flex flex-col gap-3">
              <Field label="Nom *" required value={form.nom} onChange={(v) => set("nom", v)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Téléphone" value={form.telephone} onChange={(v) => set("telephone", v)} />
                <Field label="Ville" value={form.ville} onChange={(v) => set("ville", v)} />
                <Field label="Véhicule" placeholder="Moto, Fourgon…" value={form.vehicule} onChange={(v) => set("vehicule", v)} />
                <Field label="CIN" value={form.cin} onChange={(v) => set("cin", v)} />
              </div>
              <Field label="Note" value={form.note} onChange={(v) => set("note", v)} />

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

function Field({ label, value, onChange, type = "text", required = false, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input type={type} required={required} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
    </div>
  );
}
