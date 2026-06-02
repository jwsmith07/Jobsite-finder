import { useEffect, useState } from 'react'
import CompanyLogoUploader from '../company/CompanyLogoUploader'

const EMPTY = {
  company_name: '',
  logo_url: '',
  website: '',
  phone: '',
  email: '',
  description: '',
  trades_hired: '',
  service_area: '',
}

const inputCls =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 placeholder:text-slate-500'

const labelCls = 'block text-xs uppercase tracking-wider text-slate-500 mb-1'

export default function CompanyProfileForm({
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
    onSubmit?.(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Company name</label>
          <input
            className={inputCls}
            value={values.company_name}
            onChange={(e) => set('company_name', e.target.value)}
            required
            placeholder="Acme Construction Ltd."
          />
        </div>

        <div className="sm:col-span-2">
          <CompanyLogoUploader
            userId={userId}
            value={values.logo_url}
            onChange={(url) => set('logo_url', url)}
          />
        </div>

        <div>
          <label className={labelCls}>Website</label>
          <input
            className={inputCls}
            value={values.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://..."
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
          <label className={labelCls}>Email</label>
          <input
            type="email"
            className={inputCls}
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="info@company.com"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          rows={5}
          className={inputCls}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Tell trades and partners what your company does."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Trades hired</label>
          <input
            className={inputCls}
            value={values.trades_hired}
            onChange={(e) => set('trades_hired', e.target.value)}
            placeholder="Electricians, Carpenters, Welders..."
          />
        </div>
        <div>
          <label className={labelCls}>Service area</label>
          <input
            className={inputCls}
            value={values.service_area}
            onChange={(e) => set('service_area', e.target.value)}
            placeholder="Edmonton, Calgary, all of Alberta..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-black hover:bg-amber-300 disabled:opacity-60"
      >
        {loading ? 'Saving...' : 'Save company profile'}
      </button>
    </form>
  )
}
