import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/JobsiteFinderLogoSVG.svg" alt="Jobsite Finder" className="h-[50px] w-auto" />
          <span className="text-base font-black text-white">
            Jobsite <span className="text-amber-400">Finder</span>
          </span>
        </Link>
        <p className="text-sm text-slate-400">Built for the Trades. Powered by Large-Scale Projects.</p>
        <p className="text-xs text-slate-500">© 2026 Jobsite Finder Technologies Inc.</p>
      </div>
    </footer>
  )
}
