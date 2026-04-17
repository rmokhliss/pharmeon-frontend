import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white tracking-tight">Pharmeon</h1>
        <p className="text-slate-400 mt-2">Gestion de stock para-pharmaceutique</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <Link href="/portail"
          className="group bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-2xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl shrink-0">
            🛒
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-lg">Espace Client</p>
            <p className="text-indigo-200 text-sm mt-0.5">Consulter le catalogue et passer commande</p>
          </div>
          <span className="ml-auto text-indigo-300 text-xl">→</span>
        </Link>

        <Link href="/admin/login"
          className="group bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors rounded-2xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center text-3xl shrink-0">
            ⚙️
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-lg">Espace Admin</p>
            <p className="text-slate-400 text-sm mt-0.5">Gérer le stock, clients et opérations</p>
          </div>
          <span className="ml-auto text-slate-400 text-xl">→</span>
        </Link>
      </div>

      <p className="text-slate-600 text-xs mt-12">© 2025 Pharmeon</p>
    </div>
  );
}
