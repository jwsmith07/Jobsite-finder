import { useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { PROJECT_VALUE_FILTER_OPTIONS } from '../../lib/projectValue'

const baseControl =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-400'

const nativeSelectControl = `${baseControl} [&>option]:bg-slate-950 [&>option]:text-white`

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

export default function MapFilters({
  search,
  onSearchChange,
  stage,
  onStageChange,
  stages = [],
  trade,
  onTradeChange,
  trades = [],
  minValue,
  onMinValueChange,
  onClearAll,
  hasActiveFilters = false,
}) {
  const [open, setOpen] = useState(false)

  // Count of "drawer-side" filters that are currently active. Search and
  // sort live in the always-visible bar so they don't count here.
  const activeDrawerCount = useMemo(() => {
    let n = 0
    if (stage !== 'all') n += 1
    if (trade !== 'all') n += 1
    if (minValue !== '0') n += 1
    return n
  }, [stage, trade, minValue])

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-lg shadow-black/30 sm:p-2.5">
      {/* On narrow screens the search can occupy the full first row. */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search — full row on mobile, flex-1 on sm+ */}
        <div className="relative min-w-0 basis-full flex-1 sm:basis-auto">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search project name or city"
            className={`${baseControl} pl-9`}
            aria-label="Search projects"
          />
        </div>

        {/* Filters trigger */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:border-amber-400/50 hover:text-amber-100"
          aria-label="Open filters"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Filters</span>
          {activeDrawerCount > 0 && (
            <span
              className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-black"
              aria-label={`${activeDrawerCount} active filters`}
            >
              {activeDrawerCount}
            </span>
          )}
        </button>

      </div>

      <FilterDrawer
        open={open}
        onOpenChange={setOpen}
        stage={stage}
        onStageChange={onStageChange}
        stages={stages}
        trade={trade}
        onTradeChange={onTradeChange}
        trades={trades}
        minValue={minValue}
        onMinValueChange={onMinValueChange}
        onClearAll={onClearAll}
        hasActiveFilters={hasActiveFilters}
        activeDrawerCount={activeDrawerCount}
      />
    </div>
  )
}

function FilterDrawer({
  open,
  onOpenChange,
  stage,
  onStageChange,
  stages,
  trade,
  onTradeChange,
  trades,
  minValue,
  onMinValueChange,
  onClearAll,
  hasActiveFilters,
  activeDrawerCount,
}) {
  // Slide-in animation: start off-screen, then translate to 0 on the next
  // frame so the CSS transition fires. Animating purely via Tailwind /
  // data-state attributes is unreliable without tw-animate-css here.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
            entered ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <Dialog.Content
          className={`fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
            entered ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-describedby={undefined}
        >
          <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-bold text-white">
                Filters
              </Dialog.Title>
              <p className="mt-0.5 text-xs text-slate-400">
                Narrow the projects shown on the map.
              </p>
            </div>
            <Dialog.Close
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-900 hover:text-white"
              aria-label="Close filters"
            >
              <X size={18} />
            </Dialog.Close>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <Field label="Stage">
              <select
                value={stage}
                onChange={(e) => onStageChange?.(e.target.value)}
                className={nativeSelectControl}
              >
                <option value="all">All stages</option>
                {stages.map((s) => (
                  <option key={s.key || s} value={s.key || s}>
                    {s.label || s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Trade">
              <TradeSelect
                value={trade}
                onValueChange={onTradeChange}
                trades={trades}
              />
            </Field>

            <Field label="Minimum value">
              <select
                value={minValue}
                onChange={(e) => onMinValueChange?.(e.target.value)}
                className={nativeSelectControl}
              >
                {PROJECT_VALUE_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-slate-800 bg-slate-950 px-5 py-4">
            <button
              type="button"
              onClick={onClearAll}
              disabled={!hasActiveFilters}
              className="text-sm font-semibold text-slate-300 transition hover:text-amber-200 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              Clear all
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300"
              >
                Show results
                {activeDrawerCount > 0 && (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-black/15 px-1.5 text-[11px] font-bold">
                    {activeDrawerCount}
                  </span>
                )}
              </button>
            </Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function TradeSelect({ value, onValueChange, trades = [] }) {
  return (
    <Select.Root value={value} onValueChange={(next) => onValueChange?.(next)}>
      <Select.Trigger
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-left text-sm font-semibold text-white outline-none transition hover:border-slate-500 focus:border-amber-400 data-[state=open]:border-amber-400"
        aria-label="Trade"
      >
        <Select.Value />
        <Select.Icon asChild>
          <ChevronDown size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-[60] max-h-[min(18rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 text-white shadow-2xl shadow-black/50"
        >
          <Select.Viewport className="p-1">
            <TradeSelectItem value="all">All trades</TradeSelectItem>
            {trades.map((tradeOption) => (
              <TradeSelectItem key={tradeOption} value={tradeOption}>
                {tradeOption}
              </TradeSelectItem>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

function TradeSelectItem({ value, children }) {
  return (
    <Select.Item
      value={value}
      className="relative flex min-h-10 cursor-default select-none items-center rounded-lg py-2 pl-3 pr-9 text-sm text-slate-100 outline-none transition data-[highlighted]:bg-amber-400 data-[highlighted]:text-black data-[state=checked]:bg-slate-800 data-[state=checked]:text-amber-200"
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute right-3 inline-flex items-center">
        <Check size={15} aria-hidden="true" />
      </Select.ItemIndicator>
    </Select.Item>
  )
}
