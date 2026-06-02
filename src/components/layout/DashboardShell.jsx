export default function DashboardShell({ title, subtitle, actions, children }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}
