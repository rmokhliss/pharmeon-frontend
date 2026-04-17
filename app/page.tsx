export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Pharmeon
        </h1>
        <p className="text-indigo-400 text-lg font-medium mb-4">
          Gestion &amp; Distribution Para-pharmacie
        </p>
        <p className="text-slate-400 text-sm leading-relaxed mb-10">
          Plateforme de gestion de stock, commandes et livraisons pour distributeurs intermédiaires.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Produits", icon: "📦" },
            { label: "Stock", icon: "🏭" },
            { label: "Livraisons", icon: "🚚" },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-slate-300 text-xs font-medium">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          <span className="text-indigo-300 text-xs font-medium">En développement — MVP 1</span>
        </div>
      </div>
    </main>
  );
}
