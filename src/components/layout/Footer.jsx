import Logo from '../common/Logo'

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-800/90 bg-[#0b0e12]/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <Logo asLink size="footer" />
        <p className="text-sm text-slate-400">Built for the Trades. Powered by Real Jobsites.</p>
        <p className="text-xs text-slate-500">© 2026 Jobsite Finder Technologies Inc.</p>
      </div>
    </footer>
  )
}
