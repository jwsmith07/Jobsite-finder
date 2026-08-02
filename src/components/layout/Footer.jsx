import { Link } from 'react-router-dom'
import Logo from '../common/Logo'

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-800/90 bg-[#0b0e12]/92 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-3">
            <Logo asLink size="footer" />
            <p className="text-xs text-slate-500">
              Find active construction jobsites and connect the people building them.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-200">Jobsite Finder</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/about" className="text-xs text-slate-400 hover:text-slate-300">
                  About
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-xs text-slate-400 hover:text-slate-300">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-xs text-slate-400 hover:text-slate-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-200">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/privacy" className="text-xs text-slate-400 hover:text-slate-300">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-xs text-slate-400 hover:text-slate-300">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="my-6 border-t border-slate-800" />

        <div className="text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Jobsite Finder Technologies Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
