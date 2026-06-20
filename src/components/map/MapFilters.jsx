import { Check, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'

const baseControl =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-400'

function QuickFilter({ checked, onChange, children }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      aria-pressed={checked}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
        checked
          ? 'border-amber-300 bg-amber-300 text-slate-950'
          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-amber-400/50 hover:text-amber-100'
      }`}
    >
      <span
        className={`grid h-3.5 w-3.5 place-items-center rounded border ${
          checked ? 'border-slate-950 bg-slate-950 text-amber-300' : 'border-slate-600'
        }`}
        aria-hidden="true"
      >
        {checked ? <Check size={10} strokeWidth={3} /> : null}
      </span>
      {children}
    </button>
  )
}

export default function MapFilters({
  search,
  onSearchChange,
  stage,
  onStageChange,
  hiringOnly = false,
  onHiringOnlyChange,
  claimedOnly = false,
  onClaimedOnlyChange,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (stage === 'active' || stage === 'planning') count += 1
    if (hiringOnly) count += 1
    if (claimedOnly) count += 1
    return count
  }, [claimedOnly, hiringOnly, stage])

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-lg shadow-black/30 sm:p-2.5">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search jobsites..."
            className={`${baseControl} pl-9`}
            aria-label="Search jobsites"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="relative inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:border-amber-400/50 hover:text-amber-100"
          aria-expanded={filtersOpen}
          aria-controls="jobsites-simple-filters"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span
              className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-black"
              aria-label={`${activeFilterCount} active filters`}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div
        id="jobsites-simple-filters"
        className={`${filtersOpen ? 'flex' : 'hidden'} mt-2 flex-wrap gap-1.5 pb-0.5`}
      >
        <QuickFilter
          checked={stage === 'active'}
          onChange={(checked) => onStageChange?.(checked ? 'active' : 'all')}
        >
          Active
        </QuickFilter>
        <QuickFilter
          checked={stage === 'planning'}
          onChange={(checked) => onStageChange?.(checked ? 'planning' : 'all')}
        >
          Upcoming
        </QuickFilter>
        <QuickFilter checked={hiringOnly} onChange={onHiringOnlyChange}>
          Hiring
        </QuickFilter>
        <QuickFilter checked={claimedOnly} onChange={onClaimedOnlyChange}>
          Claimed
        </QuickFilter>
      </div>
    </div>
  )
}
