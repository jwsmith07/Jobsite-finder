import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Send } from 'lucide-react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../hooks/useAuth'
import { createContractorJobsite } from '../../services/contractorJobsitesService'

const inputCls =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400'
const labelCls = 'block text-xs uppercase tracking-wider text-slate-500 mb-1'

const EMPTY = {
  project_name: '',
  display_address: '',
  latitude: '',
  longitude: '',
  project_type: '',
  sector: '',
  stage: 'Planning',
  project_value_display: '',
  start_date: '',
  estimated_completion_date: '',
  description: '',
  trades_needed: '',
  hiring_status: '',
  site_access_notes: '',
  gate_entrance: '',
  parking_instructions: '',
  muster_point: '',
  google_maps_url: '',
  primary_image_url: '',
}

export default function CreateJobsitePage() {
  const { user, role, loading } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const dashboardPath = role === 'sc' ? '/subcontractor/dashboard' : '/gc/jobsites'

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      await createContractorJobsite(form, user?.id)
      setForm(EMPTY)
      setMessage({
        type: 'success',
        text: 'Your jobsite has been submitted for review. It will appear publicly after approval.',
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <DashboardShell title="Create Jobsite"><p className="text-sm text-slate-400">Loading...</p></DashboardShell>
  }

  return (
    <DashboardShell
      title="Create Jobsite"
      subtitle="Submit a contractor-created jobsite when public project data is missing."
    >

      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            message.type === 'error'
              ? 'border-red-900/60 bg-red-950/40 text-red-300'
              : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300'
          }`}
        >
          {message.text}
          {message.type === 'success' && (
            <Link to={dashboardPath} className="ml-3 font-semibold underline underline-offset-2">
              Return to dashboard
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name" value={form.project_name} onChange={(v) => setField('project_name', v)} required />
          <div>
            <label className={labelCls}>Stage</label>
            <select className={inputCls} value={form.stage} onChange={(e) => setField('stage', e.target.value)}>
              <option>Planning</option>
              <option>Active</option>
              <option>Near Completion</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Field label="Location / display address" value={form.display_address} onChange={(v) => setField('display_address', v)} required />
          </div>
        </div>

        <details className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <summary className="cursor-pointer text-sm font-bold text-white">More Details</summary>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Project type" value={form.project_type} onChange={(v) => setField('project_type', v)} />
          <Field label="Sector" value={form.sector} onChange={(v) => setField('sector', v)} />
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <MapPin size={16} aria-hidden="true" />
              Map pin (optional)
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Latitude" type="number" step="any" value={form.latitude} onChange={(v) => setField('latitude', v)} />
              <Field label="Longitude" type="number" step="any" value={form.longitude} onChange={(v) => setField('longitude', v)} />
            </div>
          </div>
          <Field label="Project value" value={form.project_value_display} onChange={(v) => setField('project_value_display', v)} />
          <Field label="Hiring status" value={form.hiring_status} onChange={(v) => setField('hiring_status', v)} />
          <Field label="Start date" type="date" value={form.start_date} onChange={(v) => setField('start_date', v)} />
          <Field label="Estimated completion date" type="date" value={form.estimated_completion_date} onChange={(v) => setField('estimated_completion_date', v)} />
          <div className="sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea className={inputCls} rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Trades needed</label>
            <textarea className={inputCls} rows={2} value={form.trades_needed} onChange={(e) => setField('trades_needed', e.target.value)} />
          </div>
          <Field label="Gate / entrance" value={form.gate_entrance} onChange={(v) => setField('gate_entrance', v)} />
          <Field label="Muster point" value={form.muster_point} onChange={(v) => setField('muster_point', v)} />
          <div>
            <label className={labelCls}>Parking instructions</label>
            <textarea className={inputCls} rows={3} value={form.parking_instructions} onChange={(e) => setField('parking_instructions', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Site access notes</label>
            <textarea className={inputCls} rows={3} value={form.site_access_notes} onChange={(e) => setField('site_access_notes', e.target.value)} />
          </div>
          <Field label="Google Maps URL" value={form.google_maps_url} onChange={(v) => setField('google_maps_url', v)} />
          <Field label="Primary image URL" value={form.primary_image_url} onChange={(v) => setField('primary_image_url', v)} />
          </div>
        </details>

        <div className="mt-5">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
          >
            <Send size={16} aria-hidden="true" />
            {submitting ? 'Submitting...' : 'Submit for review'}
          </button>
        </div>
      </form>
    </DashboardShell>
  )
}

function Field({ label, value, onChange, type = 'text', required = false, step }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        className={inputCls}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}
