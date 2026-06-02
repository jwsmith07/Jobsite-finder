import { supabase } from '../lib/supabase'

export const JOBSITE_IMAGES_BUCKET = 'jobsite-images'
export const JOBSITE_IMAGE_MAX_SIZE = 5 * 1024 * 1024
export const JOBSITE_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
export const JOBSITE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const IMAGE_FIELDS = `
  id,
  project_id,
  company_id,
  image_url,
  storage_path,
  alt_text,
  caption,
  is_primary,
  uploaded_by,
  created_at
`

function getFileExtension(filename) {
  return filename.split('.').pop()?.toLowerCase() || ''
}

function sanitizeFilename(filename) {
  const extension = getFileExtension(filename)
  const base = filename
    .replace(/\.[^.]+$/, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/^-+|-+$/g, '')
  return `${base || 'jobsite-image'}.${extension}`
}

export function validateJobsiteImage(file) {
  if (!file) return 'Choose an image to upload.'
  const extension = getFileExtension(file.name)

  if (!JOBSITE_IMAGE_EXTENSIONS.includes(extension) || !JOBSITE_IMAGE_TYPES.includes(file.type)) {
    return 'Image must be a JPG, JPEG, PNG, or WEBP file.'
  }

  if (file.size > JOBSITE_IMAGE_MAX_SIZE) {
    return 'Image must be 5MB or smaller.'
  }

  return null
}

function sortImages(images = []) {
  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return new Date(b.created_at || 0) - new Date(a.created_at || 0)
  })
}

export function getPrimaryProjectImage(images = []) {
  return sortImages(images)[0] || null
}

export async function getProjectImages(projectId) {
  if (!projectId) return []
  const { data, error } = await supabase
    .from('project_images')
    .select(IMAGE_FIELDS)
    .eq('project_id', projectId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to load jobsite images: ${error.message}`)
  return sortImages(data ?? [])
}

export async function getProjectImagesForProjects(projectIds = []) {
  const ids = [...new Set(projectIds.filter((id) => id != null))]
  if (ids.length === 0) return new Map()

  const { data, error } = await supabase
    .from('project_images')
    .select(IMAGE_FIELDS)
    .in('project_id', ids)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[projectImagesService] Failed to load project images:', error.message)
    return new Map()
  }

  const byProject = new Map()
  for (const image of data ?? []) {
    const key = String(image.project_id)
    const list = byProject.get(key) || []
    list.push(image)
    byProject.set(key, list)
  }

  for (const [key, list] of byProject) {
    byProject.set(key, sortImages(list))
  }

  return byProject
}

export function attachProjectImages(projects = [], imagesByProject = new Map()) {
  return projects.map((project) => {
    const images = imagesByProject.get(String(project.id)) || imagesByProject.get(String(project.project_id)) || []
    return {
      ...project,
      _images: images,
      _primaryImage: getPrimaryProjectImage(images),
    }
  })
}

export async function uploadProjectImage({
  projectId,
  companyId = null,
  userId,
  file,
  isPrimary = false,
  altText = '',
  caption = '',
}) {
  if (!projectId) throw new Error('Project is required.')
  if (!userId) throw new Error('You must be signed in to upload jobsite images.')

  const validationError = validateJobsiteImage(file)
  if (validationError) throw new Error(validationError)

  const safeName = sanitizeFilename(file.name)
  const ownerSegment = companyId || 'admin'
  const path = `${projectId}/${ownerSegment}/${Date.now()}-${safeName}`
  const { error: uploadError } = await supabase.storage
    .from(JOBSITE_IMAGES_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)

  const { data: urlData } = supabase.storage.from(JOBSITE_IMAGES_BUCKET).getPublicUrl(path)
  const publicUrl = urlData?.publicUrl
  if (!publicUrl) throw new Error('Could not get uploaded image URL.')

  const row = {
    project_id: Number(projectId),
    company_id: companyId ? Number(companyId) : null,
    image_url: publicUrl,
    storage_path: path,
    alt_text: altText || null,
    caption: caption || null,
    is_primary: !!isPrimary,
    uploaded_by: userId,
  }

  const { data, error } = await supabase
    .from('project_images')
    .insert(row)
    .select(IMAGE_FIELDS)
    .maybeSingle()

  if (error) {
    await supabase.storage.from(JOBSITE_IMAGES_BUCKET).remove([path])
    throw new Error(`Failed to save image record: ${error.message}`)
  }

  return data
}

export async function setPrimaryProjectImage(image) {
  if (!image?.id || !image?.project_id) throw new Error('Image is required.')
  const { data, error } = await supabase
    .from('project_images')
    .update({ is_primary: true })
    .eq('id', image.id)
    .select(IMAGE_FIELDS)
    .maybeSingle()

  if (error) throw new Error(`Failed to set primary image: ${error.message}`)
  return data
}

export async function deleteProjectImage(image) {
  if (!image?.id) throw new Error('Image is required.')
  const { error } = await supabase
    .from('project_images')
    .delete()
    .eq('id', image.id)

  if (error) throw new Error(`Failed to delete image: ${error.message}`)

  if (image.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(JOBSITE_IMAGES_BUCKET)
      .remove([image.storage_path])
    if (storageError) {
      console.warn('[projectImagesService] Storage image delete failed:', storageError.message)
    }
  }

  return true
}
