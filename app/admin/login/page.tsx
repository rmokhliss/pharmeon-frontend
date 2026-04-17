"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAdminSession } from "@/lib/admin-auth";

const API = "/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Identifiants invalides"); }
      const data = await res.json();
      saveAdminSession(data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Pharmeon</h1>
          <p className="text-slate-400 text-sm mt-1">Espace administration</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Utilisateur</label>
            <input type="text" required value={form.username} onChange={(e) => set("username", e.target.value)}
              placeholder="admin"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Mot de passe</label>
            <input type="password" required value={form.password} onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="py-3 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
