"use client";
import { useEffect, useState, useCallback } from "react";

const API = "/api";
const PORTAL_URL = typeof window !== "undefined" ? window.location.origin : "";

type Client = {
  id: number;
  nom: string;
  type: string;
  telephone?: string;
  ville?: string;
  adresse?: string;
  email?: string;
  actif: boolean;
};

const TYPES = ["PHARMACIE", "PARA", "PARTICULIER"];
const emptyForm = { nom: "", type: "PHARMACIE", telephone: "", ville: "", adresse: "", email: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pending, setPending] = useState<Client[]>([]);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Edit modal
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Access modal
  const [accessModal, setAccessModal] = useState(false);
  const [accessClient, setAccessClient] = useState<Client | null>(null);
  const [accessForm, setAccessForm] = useState({ email: "", password: "" });
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [accessDone, setAccessDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    const q = filter ? `?search=${encodeURIComponent(filter)}` : "";
    fetch(`${API}/clients${q}`).then((r) => r.json()).then(setClients);
    fetch(`${API}/clients/pending`).then((r) => r.json()).then(setPending).catch(() => {});
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const approveClient = async (c: Client) => {
    openAccess(c);
  };

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setError(""); setModal(true); };
  const openEdit = (c: Client) => {
    setEditTarget(c);
    setForm({ nom: c.nom, type: c.type, telephone: c.telephone || "", ville: c.ville || "", adresse: c.adresse || "", email: c.email || "" });
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
        body: JSON.stringify({
          ...form,
          telephone: form.telephone || undefined,
          ville: form.ville || undefined,
          adresse: form.adresse || undefined,
          email: form.email || undefined,
        }),
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

  const openAccess = (c: Client) => {
    setAccessClient(c);
    setAccessForm({ email: c.email || "", password: "" });
    setAccessError("");
    setAccessDone(false);
    setCopied(false);
    setAccessModal(true);
  };

  const saveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessClient) return;
    setAccessSaving(true); setAccessError("");
    try {
      // Update email on client
      await fetch(`${API}/clients/${accessClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accessForm.email }),
      }).then((r) => { if (!r.ok) throw new Error("Erreur mise à jour email"); });

      // Set password
      await fetch(`${API}/auth/client/${accessClient.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: accessForm.password }),
      }).then((r) => { if (!r.ok) throw new Error("Erreur mise à jour mot de passe"); });

      setAccessDone(true);
      load();
    } catch (err: any) { setAccessError(err.message); }
    finally { setAccessSaving(false); }
  };

  const copyAccess = () => {
    const text = `Bonjour ${accessClient?.nom},\n\nVoici vos accès au portail Pharmeon :\n🔗 ${PORTAL_URL}/portail\n📧 Email : ${accessForm.email}\n🔑 Mot de passe : ${accessForm.password}\n\nVous pouvez consulter notre catalogue et passer vos commandes directement en ligne.`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
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
        <input type="text" placeholder="Rechercher..." value={filter} onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        <div className="flex gap-2 flex-wrap">
          {["ALL", ...TYPES].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${typeFilter === t ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"}`}>
              {t === "ALL" ? "Tous" : t}
            </button>
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="px-6 pt-4">
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
            <p className="text-amber-400 font-semibold text-sm mb-3">
              Demandes en attente ({pending.length})
            </p>
            <div className="flex flex-col gap-2">
              {pending.map((c) => (
                <div key={c.id} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.nom}</p>
                    <p className="text-slate-400 text-xs">{c.type}{c.ville ? ` · ${c.ville}` : ""}{c.email ? ` · ${c.email}` : ""}</p>
                  </div>
                  <button onClick={() => approveClient(c)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/70 text-emerald-400 font-medium">
                    Activer →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-4 flex flex-col gap-3">
        {visible.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Aucun client trouvé</p>}
        {visible.map((c) => (
          <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-white font-medium text-sm truncate">{c.nom}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[c.type] || "text-slate-400 bg-slate-700"}`}>{c.type}</span>
                {c.email && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium text-emerald-400 bg-emerald-500/10">✓ Portail actif</span>
                )}
              </div>
              <div className="text-slate-400 text-xs space-y-0.5">
                {c.telephone && <p>📞 {c.telephone}</p>}
                {c.ville && <p>📍 {c.ville}</p>}
                {c.email && <p>✉️ {c.email}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">Éditer</button>
                <button onClick={() => remove(c.id)} className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-800/60 text-red-400">Suppr.</button>
              </div>
              <button onClick={() => openAccess(c)}
                className="text-xs px-2 py-1 rounded bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-400 font-medium">
                🔑 Accès portail
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
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

      {/* Access modal */}
      {accessModal && accessClient && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">Accès portail</h2>
                <p className="text-slate-400 text-xs mt-0.5">{accessClient.nom}</p>
              </div>
              <button onClick={() => setAccessModal(false)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>

            {!accessDone ? (
              <form onSubmit={saveAccess} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email de connexion</label>
                  <input type="email" required placeholder="client@email.ma"
                    value={accessForm.email} onChange={(e) => setAccessForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Mot de passe</label>
                  <input type="text" required minLength={4} placeholder="Choisir un mot de passe"
                    value={accessForm.password} onChange={(e) => setAccessForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                {accessError && <p className="text-red-400 text-xs">{accessError}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setAccessModal(false)}
                    className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">Annuler</button>
                  <button type="submit" disabled={accessSaving}
                    className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
                    {accessSaving ? "..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 text-sm">
                  ✓ Accès créé avec succès
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-2 text-sm">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Informations à partager</p>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">🔗 Portail</span>
                    <span className="text-white text-xs">{PORTAL_URL}/portail</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">✉️ Email</span>
                    <span className="text-white">{accessForm.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">🔑 Mot de passe</span>
                    <span className="text-white font-mono">{accessForm.password}</span>
                  </div>
                </div>
                <button onClick={copyAccess}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${copied ? "bg-emerald-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-white"}`}>
                  {copied ? "✓ Copié !" : "📋 Copier le message à envoyer"}
                </button>
                <button onClick={() => setAccessModal(false)}
                  className="py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
