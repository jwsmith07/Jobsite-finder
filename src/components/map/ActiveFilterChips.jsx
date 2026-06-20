import { X } from 'lucide-react'
import { getPublicStageLabel } from '../../lib/projectStages'
import { PROJECT_VALUE_FILTER_LABELS } from '../../lib/projectValue'
import { getCanadianRegionLabel } from '../../lib/canadianRegions'

export default function ActiveFilterChips({
  province,
  stage,
  trade,
  minValue,
  onClearProvince,
  onClearStage,
  onClearTrade,
  onClearMinValue,
  onClearAll,
}) {
  // Predicates mirror MapFilters' activeDrawerCount logic exactly so the
  // chip count and the drawer "Filters" badge always agree.
  const chips = []

  if (province !== 'all') {
    chips.push({
      key: 'province',
      label: `Province: ${getCanadianRegionLabel(province) || province}`,
      onClear: onClearProvince,
      testId: 'active-filter-chip-province',
    })
  }
  if (stage !== 'all') {
    chips.push({
      key: 'stage',
      label: `Stage: ${getPublicStageLabel(stage)}`,
      onClear: onClearStage,
      testId: 'active-filter-chip-stage',
    })
  }
  if (trade !== 'all') {
    chips.push({
      key: 'trade',
      label: `Trade: ${trade}`,
      onClear: onClearTrade,
      testId: 'active-filter-chip-trade',
    })
  }
  if (minValue !== '0') {
    const label = PROJECT_VALUE_FILTER_LABELS[minValue] || minValue
    chips.push({
      key: 'minValue',
      label: `Min value: ${label}`,
      onClear: onClearMinValue,
      testId: 'active-filter-chip-min-value',
    })
  }
  if (chips.length === 0) return null

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 px-1"
      data-testid="active-filter-chips"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          data-testid={chip.testId}
          className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 py-1 pl-3 pr-1 text-xs font-semibold text-amber-100"
        >
          <span className="max-w-[14rem] truncate">{chip.label}</span>
          <button
            type="button"
            onClick={chip.onClear}
            aria-label={`Remove filter: ${chip.label}`}
            title={`Remove filter: ${chip.label}`}
            className="ml-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-amber-200/80 transition hover:bg-amber-400/20 hover:text-white"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </span>
      ))}

      {chips.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          data-testid="active-filter-chips-clear-all"
          className="ml-1 rounded-full px-2 py-1 text-xs font-semibold text-slate-400 underline-offset-2 transition hover:text-amber-200 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
