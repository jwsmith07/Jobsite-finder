import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export default function ResumeUpload({ userId, value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!userId) {
      setMessage({ type: 'error', text: 'You must be signed in to upload.' })
      return
    }

    setUploading(true)
    setMessage(null)
    try {
      const path = `${userId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (uploadError) throw uploadError

      const { data: pub } = supabase.storage.from('resumes').getPublicUrl(path)
      const url = pub?.publicUrl
      if (!url) throw new Error('Could not get public URL.')

      onChange?.(url)
      setMessage({ type: 'success', text: 'Resume uploaded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-wider text-slate-500">
        Resume
      </label>
      <input
        type="file"
        accept={ACCEPT}
        onChange={handleFile}
        disabled={uploading}
        className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-yellow-400 file:px-3 file:py-2 file:font-bold file:text-black hover:file:bg-yellow-300 disabled:opacity-60"
      />
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-yellow-300 underline"
        >
          View current resume
        </a>
      )}
      {uploading && (
        <p className="text-xs text-slate-400">Uploading...</p>
      )}
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
  )
}
