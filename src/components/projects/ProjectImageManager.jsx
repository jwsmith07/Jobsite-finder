import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Star, Trash2, Upload } from 'lucide-react'
import {
  deleteProjectImage,
  getProjectImages,
  setPrimaryProjectImage,
  uploadProjectImage,
} from '../../services/projectImagesService'

function imageAlt(projectName, image) {
  return image?.alt_text || image?.caption || `${projectName || 'Jobsite'} photo`
}

export default function ProjectImageManager({
  projectId,
  projectName,
  companyId = null,
  userId,
  canManage = false,
  initialImages = [],
  onImagesChanged,
}) {
  const inputRef = useRef(null)
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const [workingId, setWorkingId] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setImages(initialImages || [])
  }, [initialImages])

  async function refreshImages() {
    const next = await getProjectImages(projectId)
    setImages(next)
    onImagesChanged?.(next)
    return next
  }

  async function handleUpload(file) {
    if (!file) return
    setUploading(true)
    setMessage(null)
    try {
      await uploadProjectImage({
        projectId,
        companyId,
        userId,
        file,
        isPrimary: images.length === 0,
        altText: projectName ? `${projectName} jobsite photo` : 'Jobsite photo',
      })
      await refreshImages()
      setMessage({ type: 'success', text: 'Image uploaded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleSetPrimary(image) {
    setWorkingId(image.id)
    setMessage(null)
    try {
      await setPrimaryProjectImage(image)
      await refreshImages()
      setMessage({ type: 'success', text: 'Primary image updated.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setWorkingId(null)
    }
  }

  async function handleDelete(image) {
    const ok = window.confirm('Remove this jobsite image? This cannot be undone.')
    if (!ok) return

    setWorkingId(image.id)
    setMessage(null)
    try {
      await deleteProjectImage(image)
      await refreshImages()
      setMessage({ type: 'success', text: 'Image removed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-4">
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => handleUpload(e.target.files?.[0])}
            className="sr-only"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300">
                <ImagePlus size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Jobsite images</p>
                <p className="mt-1 text-xs text-slate-400">JPG, PNG, or WEBP up to 5MB.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-60"
            >
              <Upload size={15} aria-hidden="true" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-black/25 p-4 text-sm text-slate-400">
          No jobsite images yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <article
              key={image.id}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
            >
              <div className="aspect-[4/3] bg-slate-900">
                <img
                  src={image.image_url}
                  alt={imageAlt(projectName, image)}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-3 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                    image.is_primary
                      ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}>
                    <Star size={11} aria-hidden="true" />
                    {image.is_primary ? 'Primary' : 'Gallery'}
                  </span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDelete(image)}
                      disabled={workingId === image.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {canManage && !image.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(image)}
                    disabled={workingId === image.id}
                    className="w-full rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-xs font-semibold text-yellow-300 transition hover:border-yellow-400 hover:bg-yellow-400/20 disabled:opacity-60"
                  >
                    Make Primary
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
