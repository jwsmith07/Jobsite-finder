import { useEffect, useState } from 'react'
import ResumeUpload from './ResumeUpload'
import {
  apprenticeshipSelectValue,
  normalizeApprenticeshipLevel,
  normalizeTrade,
  renderApprenticeshipLevelOptions,
  renderTradeOptions,
  tradeSelectValue,
} from '../../lib/trades'

const EMPTY = {
  headline: '',
  trade: '',
  secondary_trade: '',
  apprenticeship_level: '',
  experience_years: '',
  city: '',
  province: 'Alberta',
  camp_ready: false,
  willing_to_travel: false,
  bio: '',
  phone: '',
  availability: '',
  resume_url: '',
}

const inputCls =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 placeholder:text-slate-500'

const labelCls = 'block text-xs uppercase tracking-wider text-slate-500 mb-1'

export default function WorkerProfileForm({
  initialValues,
  onSubmit,
  loading,
  userId,
}) {
  const [values, setValues] = useState({ ...EMPTY, ...(initialValues || {}) })

  useEffect(() => {
    setValues({ ...EMPTY, ...(initialValues || {}) })
  }, [initialValues])

  function set(field, val) {
    setValues((v) => ({ ...v, [field]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit?.({
      ...values,
      trade: normalizeTrade(values.trade),
      secondary_trade: normalizeTrade(values.secondary_trade),
      apprenticeship_level: normalizeApprenticeshipLevel(values.apprenticeship_level),
    })
  }

  const primaryTradeValue = tradeSelectValue(values.trade)
  const secondaryTradeValue = tradeSelectValue(values.secondary_trade)
  const apprenticeshipLevelValue = apprenticeshipSelectValue(values.apprenticeship_level)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelCls}>Headline</label>
        <input
          className={inputCls}
          value={values.headline}
          onChange={(e) => set('headline', e.target.value)}
          placeholder="Journeyman Electrician — 8 yrs commercial"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Primary Trade</label>
          <select
            className={inputCls}
            value={primaryTradeValue}
            onChange={(e) => set('trade', e.target.value)}
            required
          >
            {renderTradeOptions({ placeholder: values.trade ? `Legacy: ${normalizeTrade(values.trade)}` : 'Select primary trade' })}
          </select>
          {values.trade && !primaryTradeValue && (
            <p className="mt-1 text-xs text-slate-500">Current legacy value: {normalizeTrade(values.trade)}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Secondary Trade</label>
          <select
            className={inputCls}
            value={secondaryTradeValue}
            onChange={(e) => set('secondary_trade', e.target.value)}
          >
            {renderTradeOptions({ placeholder: values.secondary_trade ? `Legacy: ${normalizeTrade(values.secondary_trade)}` : 'Optional secondary trade' })}
          </select>
          {values.secondary_trade && !secondaryTradeValue && (
            <p className="mt-1 text-xs text-slate-500">Current legacy value: {normalizeTrade(values.secondary_trade)}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Apprenticeship Level</label>
          <select
            className={inputCls}
            value={apprenticeshipLevelValue}
            onChange={(e) => set('apprenticeship_level', e.target.value)}
          >
            {renderApprenticeshipLevelOptions({ placeholder: values.apprenticeship_level ? `Legacy: ${normalizeApprenticeshipLevel(values.apprenticeship_level)}` : 'Select level' })}
          </select>
          {values.apprenticeship_level && !apprenticeshipLevelValue && (
            <p className="mt-1 text-xs text-slate-500">Current legacy value: {normalizeApprenticeshipLevel(values.apprenticeship_level)}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Years Experience</label>
          <input
            type="number"
            min="0"
            className={inputCls}
            value={values.experience_years}
            onChange={(e) => set('experience_years', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <input
            className={inputCls}
            value={values.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Edmonton, Calgary..."
          />
        </div>
        <div>
          <label className={labelCls}>Province</label>
          <input
            className={inputCls}
            value={values.province}
            onChange={(e) => set('province', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input
            className={inputCls}
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="780-555-0100"
          />
        </div>
        <div>
          <label className={labelCls}>Availability</label>
          <input
            className={inputCls}
            value={values.availability}
            onChange={(e) => set('availability', e.target.value)}
            placeholder="Immediate, 2 weeks notice..."
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={!!values.camp_ready}
            onChange={(e) => set('camp_ready', e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-amber-400"
          />
          Camp ready
        </label>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={!!values.willing_to_travel}
            onChange={(e) => set('willing_to_travel', e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-amber-400"
          />
          Willing to travel for work
        </label>
      </div>

      <div>
        <label className={labelCls}>Bio</label>
        <textarea
          rows={5}
          className={inputCls}
          value={values.bio}
          onChange={(e) => set('bio', e.target.value)}
          placeholder="Brief summary of your experience and certifications."
        />
      </div>

      <ResumeUpload
        userId={userId}
        value={values.resume_url}
        onChange={(url) => set('resume_url', url)}
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-black hover:bg-amber-300 disabled:opacity-60"
      >
        {loading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}
