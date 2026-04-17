"use client";
import Link from "next/link";
import { useState } from "react";

type RegisterForm = {
  nom: string;
  type: string;
  ville: string;
  telephone: string;
  email: string;
  message: string;
};

const emptyForm: RegisterForm = { nom: "", type: "PHARMACIE", ville: "", telephone: "", email: "", message: "" };

export default function HomePage() {
  const [form, setForm] = useState<RegisterForm>(emptyForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: keyof RegisterForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/clients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Erreur lors de l'envoi");
      }
      setStatus("success");
      setForm(emptyForm);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-white">Pharmeon</span>
        <div className="flex items-center gap-3">
          <Link href="/portail"
            className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800">
            Espace Client
          </Link>
          <Link href="/admin/login"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium">
            Admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <div className="inline-block bg-indigo-600/20 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Distribution Para-Pharmaceutique
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
          Votre partenaire en distribution para-pharmaceutique
        </h1>
        <p className="text-slate-400 text-lg mb-10">
          Pharmeon relie les laboratoires aux pharmacies et parapharmacies du Maroc. Catalogue complet, commandes en ligne, livraison fiable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/portail"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
            Accéder au catalogue →
          </Link>
          <a href="#demande"
            className="border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
            Devenir client
          </a>
        </div>
      </section>

      {/* Access cards */}
      <section className="px-6 py-12 max-w-2xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/portail"
            className="bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl shrink-0">🛒</div>
            <div>
              <p className="text-white font-semibold text-lg">Espace Client</p>
              <p className="text-indigo-200 text-sm mt-1">Consultez le catalogue et passez commande en quelques clics</p>
            </div>
          </Link>
          <Link href="/admin/login"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl shrink-0">⚙️</div>
            <div>
              <p className="text-white font-semibold text-lg">Espace Admin</p>
              <p className="text-slate-400 text-sm mt-1">Gérez le stock, clients et opérations de distribution</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Signup */}
      <section id="demande" className="px-6 py-16 max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Demande d'accès</h2>
          <p className="text-slate-400 text-sm mt-2">Vous êtes pharmacie ou parapharmacie ? Rejoignez notre réseau de distribution.</p>
        </div>

        {status === "success" ? (
          <div className="bg-emerald-900/40 border border-emerald-700 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-emerald-300 font-semibold">Demande envoyée !</p>
            <p className="text-slate-400 text-sm mt-2">Nous étudierons votre demande et vous contacterons dans les plus brefs délais.</p>
            <button onClick={() => setStatus("idle")} className="mt-4 text-sm text-slate-400 hover:text-white underline">
              Envoyer une autre demande
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom de l'établissement *</label>
                <input required value={form.nom} onChange={(e) => set("nom", e.target.value)}
                  placeholder="Pharmacie du Centre"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Type *</label>
                <select required value={form.type} onChange={(e) => set("type", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="PHARMACIE">Pharmacie</option>
                  <option value="PARA">Parapharmacie</option>
                  <option value="PARTICULIER">Autre</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ville *</label>
                <input required value={form.ville} onChange={(e) => set("ville", e.target.value)}
                  placeholder="Casablanca"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Téléphone</label>
                <input value={form.telephone} onChange={(e) => set("telephone", e.target.value)}
                  placeholder="+212 6 XX XX XX XX"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="contact@pharmacie.ma"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Message (optionnel)</label>
              <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={3}
                placeholder="Informations complémentaires..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
            </div>

            {status === "error" && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}

            <button type="submit" disabled={status === "loading"}
              className="py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {status === "loading" ? "Envoi en cours..." : "Envoyer la demande →"}
            </button>
          </form>
        )}
      </section>

      {/* About */}
      <section id="apropos" className="px-6 py-16 max-w-3xl mx-auto border-t border-slate-800">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">À propos de Pharmeon</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: "🏭", title: "Sourcing direct", desc: "Nous approvisionnons directement auprès des laboratoires pour garantir qualité et traçabilité." },
            { icon: "🚚", title: "Distribution rapide", desc: "Livraison dans tout le Maroc avec suivi de commande en temps réel depuis le portail." },
            { icon: "💊", title: "Catalogue complet", desc: "Plus de 200 références : cosmétiques, hygiène, dermocosmétique, compléments alimentaires." },
          ].map((item) => (
            <div key={item.title} className="bg-slate-800/60 rounded-2xl p-6">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-6 py-16 max-w-xl mx-auto border-t border-slate-800 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
        <p className="text-slate-400 text-sm mb-6">Pour toute question commerciale ou technique, contactez-nous.</p>
        <div className="flex flex-col gap-3 items-center">
          <a href="mailto:contact@pharmeon.ma" className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm">
            📧 contact@pharmeon.ma
          </a>
          <a href="tel:+212522000000" className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm">
            📞 +212 5 22 00 00 00
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center">
        <p className="text-slate-600 text-xs">© 2025 Pharmeon — Distribution Para-Pharmaceutique</p>
      </footer>
    </div>
  );
}
