import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const BUCKET = 'company-logos'
const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg']
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

function getFileExtension(filename) {
  return filename.split('.').pop()?.toLowerCase() || ''
}

function sanitizeFilename(filename) {
  return filename
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
}

function validateFile(file) {
  const extension = getFileExtension(file.name)

  if (!ALLOWED_EXTENSIONS.includes(extension) || !ALLOWED_TYPES.includes(file.type)) {
    return 'Logo must be a PNG, JPG, JPEG, WEBP, or SVG file.'
  }

  if (file.size > MAX_SIZE) {
    return 'Logo must be 2MB or smaller.'
  }

  return null
}

export default function CompanyLogoUploader({ userId, value, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState(null)

  async function uploadFile(file) {
    if (!file) return

    if (!userId) {
      setMessage({ type: 'error', text: 'You must be signed in to upload a logo.' })
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const safeName = sanitizeFilename(file.name)
      const path = `${userId}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const publicUrl = data?.publicUrl
      if (!publicUrl) throw new Error('Could not get public logo URL.')

      onChange?.(publicUrl)
      setMessage({ type: 'success', text: 'Logo uploaded.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text:
          err.message ||
          'Logo upload failed. Check that the company-logos bucket and storage policies are configured.',
      })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleInputChange(e) {
    uploadFile(e.target.files?.[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    uploadFile(e.dataTransfer.files?.[0])
  }

  function clearLogo() {
    onChange?.('')
    setMessage(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs uppercase tracking-wider text-slate-500">
        Company logo
      </label>

      <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
        <div className="flex h-36 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-3">
          {value ? (
            <img
              src={value}
              alt="Company logo preview"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-center text-sm text-slate-500">No logo</div>
          )}
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-36 cursor-pointer flex-col justify-center rounded-lg border border-dashed p-5 transition ${
            dragging
              ? 'border-amber-400 bg-amber-400/10'
              : 'border-slate-700 bg-slate-950 hover:border-slate-500'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleInputChange}
            disabled={uploading}
            className="sr-only"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-100">
                Drag and drop your logo here, or click to upload.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                PNG, JPG, WEBP, SVG up to 2MB.
              </p>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {value && (
          <button
            type="button"
            onClick={clearLogo}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-300"
          >
            <X className="h-3.5 w-3.5" />
            Remove Logo
          </button>
        )}
        {uploading && <p className="text-xs text-slate-400">Uploading logo...</p>}
        {message && (
          <p
            className={`text-xs ${
              message.type === 'error' ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
