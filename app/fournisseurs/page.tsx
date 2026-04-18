"use client";
import { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/admin-auth";

type Fournisseur = {
  id: number;
  nom: string;
  contact?: string;
  telephone?: string;
  email?: string;
  ville?: string;
  code_postal?: string;
  adresse?: string;
  ice?: string;
  patente?: string;
  rc?: string;
  site_web?: string;
  actif: boolean;
};

const emptyForm = {
  nom: "", contact: "", telephone: "", email: "",
  ville: "", code_postal: "", adresse: "",
  ice: "", patente: "", rc: "", site_web: "",
};

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [filter, setFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Fournisseur | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const q = filter ? `?search=${encodeURIComponent(filter)}` : "";
    adminFetch<Fournisseur[]>(`/fournisseurs${q}`).then(setFournisseurs).catch((e) => setError(e.message));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setError(""); setModal(true); };
  const openEdit = (f: Fournisseur) => {
    setEditTarget(f);
    setForm({
      nom: f.nom,
      contact: f.contact || "",
      telephone: f.telephone || "",
      email: f.email || "",
      ville: f.ville || "",
      code_postal: f.code_postal || "",
      adresse: f.adresse || "",
      ice: f.ice || "",
      patente: f.patente || "",
      rc: f.rc || "",
      site_web: f.site_web || "",
    });
    setError("");
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const path = editTarget ? `/fournisseurs/${editTarget.id}` : `/fournisseurs`;
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
    if (!confirm("Supprimer ce fournisseur ?")) return;
    try {
      await adminFetch(`/fournisseurs/${id}`, { method: "DELETE" });
      load();
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 sm:pb-6">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <p className="text-white font-medium">Fournisseurs</p>
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
        {fournisseurs.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">Aucun fournisseur trouvé</p>
        )}
        {fournisseurs.map((f) => {
          const open = expanded === f.id;
          return (
            <div key={f.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-3">
                <button onClick={() => setExpanded(open ? null : f.id)} className="flex-1 min-w-0 text-left">
                  <p className="text-white font-medium text-sm truncate mb-1">{f.nom}</p>
                  <div className="text-slate-400 text-xs space-y-0.5">
                    {f.contact && <p>👤 {f.contact}</p>}
                    {f.telephone && <p>📞 {f.telephone}</p>}
                    {f.email && <p>✉️ {f.email}</p>}
                    {f.ville && <p>📍 {f.ville}{f.code_postal ? `, ${f.code_postal}` : ""}</p>}
                  </div>
                </button>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(f)} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">Éditer</button>
                  <button onClick={() => remove(f.id)} className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-800/60 text-red-400">Suppr.</button>
                </div>
              </div>
              {open && (
                <div className="border-t border-slate-700 px-4 py-3 grid grid-cols-2 gap-y-1 gap-x-3 text-xs">
                  {f.adresse && <DetailRow label="Adresse" value={f.adresse} span={2} />}
                  {f.ice && <DetailRow label="ICE" value={f.ice} />}
                  {f.patente && <DetailRow label="Patente" value={f.patente} />}
                  {f.rc && <DetailRow label="RC" value={f.rc} />}
                  {f.site_web && <DetailRow label="Site web" value={f.site_web} />}
                  {!f.adresse && !f.ice && !f.patente && !f.rc && !f.site_web && (
                    <p className="col-span-2 text-slate-500 italic">Aucune info professionnelle renseignée.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
            <h2 className="text-white font-semibold">{editTarget ? "Modifier le fournisseur" : "Nouveau fournisseur"}</h2>
            <form onSubmit={save} className="flex flex-col gap-3">
              <FormField label="Nom *" required value={form.nom} onChange={(v) => set("nom", v)} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Contact (personne)" value={form.contact} onChange={(v) => set("contact", v)} />
                <FormField label="Téléphone" value={form.telephone} onChange={(v) => set("telephone", v)} />
                <FormField label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
                <FormField label="Site web" type="url" value={form.site_web} onChange={(v) => set("site_web", v)} />
              </div>

              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider pt-2 border-t border-slate-700">Adresse</p>
              <FormField label="Adresse" value={form.adresse} onChange={(v) => set("adresse", v)} />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Ville" value={form.ville} onChange={(v) => set("ville", v)} />
                <FormField label="Code postal" value={form.code_postal} onChange={(v) => set("code_postal", v)} />
              </div>

              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider pt-2 border-t border-slate-700">Identifiants pro</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="ICE" value={form.ice} onChange={(v) => set("ice", v)} />
                <FormField label="Patente" value={form.patente} onChange={(v) => set("patente", v)} />
                <FormField label="RC" value={form.rc} onChange={(v) => set("rc", v)} />
              </div>

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

function FormField({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
    </div>
  );
}

function DetailRow({ label, value, span = 1 }: { label: string; value: string; span?: 1 | 2 }) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <p className="text-slate-500 uppercase tracking-wider text-[10px]">{label}</p>
      <p className="text-white">{value}</p>
    </div>
  );
}
