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
import {
  AVAILABILITY_OPTIONS,
  CERTIFICATION_OPTIONS,
  WORK_PREFERENCE_OPTIONS,
  WORK_REGION_OPTIONS,
  TALENT_VISIBILITY_OPTIONS,
  getProfileCertifications,
  normalizeList,
} from '../../lib/workerCredentials'

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
  availability_status: '',
  work_preferences: [],
  preferred_regions: [],
  trade_level: '',
  certifications: [],
  talent_visibility: 'approved_gcs',
  resume_url: '',
}

const inputCls =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 placeholder:text-slate-500'
const labelCls = 'block text-xs uppercase tracking-wider text-slate-500 mb-1'
const TRADE_LEVEL_OPTIONS = ['Entry Level', 'Apprentice', 'Journeyman', 'Red Seal']

function toggleListValue(list, value) {
  const current = normalizeList(list)
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
}

function CheckboxGroup({ label, options, values, onChange }) {
  const selected = normalizeList(values)
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(toggleListValue(selected, option))}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-amber-400"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}

export default function WorkerProfileForm({ initialValues, onSubmit, loading, userId }) {
  const [values, setValues] = useState({ ...EMPTY, ...(initialValues || {}) })

  useEffect(() => {
    setValues({
      ...EMPTY,
      ...(initialValues || {}),
      work_preferences: normalizeList(initialValues?.work_preferences),
      preferred_regions: normalizeList(initialValues?.preferred_regions),
      certifications: getProfileCertifications(initialValues),
    })
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
      work_preferences: normalizeList(values.work_preferences),
      preferred_regions: normalizeList(values.preferred_regions),
      certifications: normalizeList(values.certifications),
    })
  }

  const primaryTradeValue = tradeSelectValue(values.trade)
  const secondaryTradeValue = tradeSelectValue(values.secondary_trade)
  const apprenticeshipLevelValue = apprenticeshipSelectValue(values.apprenticeship_level)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
        <p className="text-sm font-semibold text-amber-200">Start with the basics.</p>
        <p className="mt-1 text-sm text-slate-400">
          Add your trade, location, experience, and resume so contractors can understand your fit quickly.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Primary Trade</label>
          <select className={inputCls} value={primaryTradeValue} onChange={(e) => set('trade', e.target.value)} required>
            {renderTradeOptions({ placeholder: values.trade ? `Legacy: ${normalizeTrade(values.trade)}` : 'Select primary trade' })}
          </select>
          {values.trade && !primaryTradeValue && (
            <p className="mt-1 text-xs text-slate-500">Current legacy value: {normalizeTrade(values.trade)}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Experience Level</label>
          <select className={inputCls} value={apprenticeshipLevelValue} onChange={(e) => set('apprenticeship_level', e.target.value)}>
            {renderApprenticeshipLevelOptions({ placeholder: values.apprenticeship_level ? `Legacy: ${normalizeApprenticeshipLevel(values.apprenticeship_level)}` : 'Select level' })}
          </select>
        </div>
        <div>
          <label className={labelCls}>Years Experience</label>
          <input type="number" min="0" className={inputCls} value={values.experience_years} onChange={(e) => set('experience_years', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <input className={inputCls} value={values.city} onChange={(e) => set('city', e.target.value)} placeholder="Edmonton, Calgary..." />
        </div>
        <div>
          <label className={labelCls}>Province</label>
          <input className={inputCls} value={values.province} onChange={(e) => set('province', e.target.value)} />
        </div>
      </div>

      <ResumeUpload userId={userId} value={values.resume_url} onChange={(url) => set('resume_url', url)} />

      <details className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <summary className="cursor-pointer text-sm font-bold text-white">Additional Information</summary>
        <div className="mt-5 space-y-5">
          <div>
            <label className={labelCls}>Headline</label>
            <input className={inputCls} value={values.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Journeyman Electrician - 8 yrs commercial" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Secondary Trade</label>
              <select className={inputCls} value={secondaryTradeValue} onChange={(e) => set('secondary_trade', e.target.value)}>
                {renderTradeOptions({ placeholder: values.secondary_trade ? `Legacy: ${normalizeTrade(values.secondary_trade)}` : 'Optional secondary trade' })}
              </select>
              {values.secondary_trade && !secondaryTradeValue && (
                <p className="mt-1 text-xs text-slate-500">Current legacy value: {normalizeTrade(values.secondary_trade)}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Trade Level</label>
              <select className={inputCls} value={values.trade_level || ''} onChange={(e) => set('trade_level', e.target.value)}>
                <option value="">Select trade level</option>
                {TRADE_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={values.phone} onChange={(e) => set('phone', e.target.value)} placeholder="780-555-0100" />
            </div>
            <div>
              <label className={labelCls}>Availability</label>
              <select className={inputCls} value={values.availability_status || ''} onChange={(e) => set('availability_status', e.target.value)}>
                <option value="">Select availability</option>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Talent Discovery Visibility</label>
              <select className={inputCls} value={values.talent_visibility || 'approved_gcs'} onChange={(e) => set('talent_visibility', e.target.value)}>
                {TALENT_VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <CheckboxGroup label="Certifications" options={CERTIFICATION_OPTIONS} values={values.certifications} onChange={(next) => set('certifications', next)} />
          <CheckboxGroup label="Work Preferences" options={WORK_PREFERENCE_OPTIONS} values={values.work_preferences} onChange={(next) => set('work_preferences', next)} />
          <CheckboxGroup label="Preferred Work Regions" options={WORK_REGION_OPTIONS} values={values.preferred_regions} onChange={(next) => set('preferred_regions', next)} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
              <input type="checkbox" checked={!!values.camp_ready} onChange={(e) => set('camp_ready', e.target.checked)} className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-amber-400" />
              Camp ready
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
              <input type="checkbox" checked={!!values.willing_to_travel} onChange={(e) => set('willing_to_travel', e.target.checked)} className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-amber-400" />
              Willing to travel for work
            </label>
          </div>

          <div>
            <label className={labelCls}>Bio</label>
            <textarea rows={5} className={inputCls} value={values.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Brief summary of your experience and certifications." />
          </div>
        </div>
      </details>

      <button type="submit" disabled={loading} className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-black hover:bg-amber-300 disabled:opacity-60">
        {loading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}
