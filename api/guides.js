// ================================================
// /api/guides.js — SERVERLESS FUNCTION untuk Panduan/Tutorial
// ================================================

import { createClient } from '@supabase/supabase-js'

// Check environment variables
if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('ENV MISSING: SUPABASE_URL atau SERVICE_ROLE_KEY belum diset!')
}

// Initialize Supabase Admin Client (sama persis kayak blog.js & admin.js)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

// Helper function untuk error handling
class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function handleError(error) {
  throw new ApiError(error.message || 'Terjadi kesalahan', 400)
}

// ================================================
// RETRY WRAPPER — buat nangani transient network/DNS error
// (contoh: "TypeError: fetch failed" / "ENOTFOUND" pas cold start)
// ================================================

function isTransientNetworkError(err) {
  const msg = String(err?.message || '')
  const cause = String(err?.cause?.message || err?.details || '')
  return (
    msg.includes('fetch failed') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    cause.includes('ENOTFOUND') ||
    cause.includes('ECONNRESET') ||
    cause.includes('ETIMEDOUT')
  )
}

async function withRetry(fn, retries = 2, delayMs = 300) {
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isTransientNetworkError(err)) throw err
      if (attempt === retries) throw err
      console.warn(`Guides API: transient network error, retry ke-${attempt + 1}...`, err.message)
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
    }
  }
  throw lastErr
}

// ================================================
// AUTH HELPER — validasi token + wajib admin
// (pola sama kayak verifyToken di admin.js)
// ================================================

function getAdminEmails() {
  const raw = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || ''
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

async function verifyAdminToken(token) {
  if (!token) throw new ApiError('Token diperlukan', 401)

  const { data: tokenRow, error: tokenErr } = await withRetry(() =>
    supabaseAdmin.from('tokens').select('*').eq('token', token).single()
  )
  if (tokenErr || !tokenRow) throw new ApiError('Token tidak valid', 401)
  if (new Date(tokenRow.expires_at) < new Date()) {
    throw new ApiError('Token kadaluarsa, silakan login ulang', 401)
  }

  const { data: userRow, error: userErr } = await withRetry(() =>
    supabaseAdmin.from('users').select('email').eq('id', tokenRow.user_id).single()
  )
  if (userErr || !userRow) throw new ApiError('User tidak ditemukan', 401)

  const adminEmails = getAdminEmails()
  const isAdmin = adminEmails.includes(String(userRow.email || '').toLowerCase())
  if (!isAdmin) throw new ApiError('Khusus admin', 403)

  return userRow
}

// ================================================
// GUIDES API METHODS
// ================================================

const guideApi = {
  // GET: List panduan PUBLISHED saja (untuk publik / halaman panduan biasa)
  getAll: async (filters = {}) => {
    try {
      let query = supabaseAdmin
        .from('guides')
        .select('*')
        .eq('is_published', true)
      
      if (filters.category) query = query.eq('category', filters.category)
      if (filters.level) query = query.eq('level', filters.level)
      
      query = query
        .order('order', { ascending: false })
        .order('created_at', { ascending: false })

      const { data, error } = await withRetry(() => query)
      if (error) handleError(error)
      return { success: true, data: data || [] }
    } catch (err) {
      console.error('Guides API Error (getAll):', err)
      throw err
    }
  },

  // GET: List SEMUA panduan termasuk draft (khusus admin, wajib token)
  getAllAdmin: async (token) => {
    try {
      await verifyAdminToken(token)

      const { data, error } = await withRetry(() =>
        supabaseAdmin
          .from('guides')
          .select('*')
          .order('created_at', { ascending: false })
      )

      if (error) handleError(error)
      return { success: true, data: data || [] }
    } catch (err) {
      console.error('Guides API Error (getAllAdmin):', err)
      throw err
    }
  },

  // GET: Single panduan by slug
  getBySlug: async (slug) => {
    try {
      const { data: guide, error } = await withRetry(() =>
        supabaseAdmin
          .from('guides')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single()
      )

      if (error) handleError(error)
      if (!guide) throw new ApiError('Panduan tidak ditemukan', 404)

      return { success: true, data: guide }
    } catch (err) {
      console.error('Guides API Error (getBySlug):', err)
      throw err
    }
  },

  // GET: Single panduan by ID (untuk admin — wajib token)
  getById: async (token, id) => {
    try {
      await verifyAdminToken(token)

      const { data, error } = await withRetry(() =>
        supabaseAdmin
          .from('guides')
          .select('*')
          .eq('id', id)
          .single()
      )

      if (error) handleError(error)
      if (!data) throw new ApiError('Panduan tidak ditemukan', 404)

      return { success: true, data }
    } catch (err) {
      console.error('Guides API Error (getById):', err)
      throw err
    }
  },

  // CREATE: Panduan baru (wajib token admin)
  create: async (token, data) => {
    try {
      await verifyAdminToken(token)

      const slug = data.slug || data.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80)

      const { data: guide, error } = await withRetry(() =>
        supabaseAdmin
          .from('guides')
          .insert({
            title: data.title,
            slug: slug,
            excerpt: data.excerpt || '',
            content: data.content,
            category: data.category || 'Setup Toko',
            level: data.level || 'beginner',
            duration_minutes: Number(data.duration_minutes) || 5,
            steps_count: Number(data.steps_count) || 0,
            featured_image: data.featured_image || '',
            is_published: data.is_published || false,
            order: Number(data.order) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
      )

      if (error) handleError(error)
      return { success: true, data: guide }
    } catch (err) {
      console.error('Guides API Error (create):', err)
      throw err
    }
  },

  // UPDATE: Panduan existing (wajib token admin)
  update: async (token, id, data) => {
    try {
      await verifyAdminToken(token)

      const slug = data.slug || data.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80)

      const { data: guide, error } = await withRetry(() =>
        supabaseAdmin
          .from('guides')
          .update({
            title: data.title,
            slug: slug,
            excerpt: data.excerpt,
            content: data.content,
            category: data.category,
            level: data.level,
            duration_minutes: Number(data.duration_minutes),
            steps_count: Number(data.steps_count),
            featured_image: data.featured_image,
            is_published: data.is_published,
            order: Number(data.order),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()
      )

      if (error) handleError(error)
      return { success: true, data: guide }
    } catch (err) {
      console.error('Guides API Error (update):', err)
      throw err
    }
  },

  // DELETE: Hapus panduan (wajib token admin)
  delete: async (token, id) => {
    try {
      await verifyAdminToken(token)

      const { error } = await withRetry(() =>
        supabaseAdmin
          .from('guides')
          .delete()
          .eq('id', id)
      )

      if (error) handleError(error)
      return { success: true }
    } catch (err) {
      console.error('Guides API Error (delete):', err)
      throw err
    }
  },

  // UPLOAD: Featured image panduan (wajib token admin)
  // Terima base64 dari frontend, upload ke bucket 'guide-images', balikin public URL.
  uploadImage: async (token, { fileBase64, fileName, contentType }) => {
    try {
      await verifyAdminToken(token)

      if (!fileBase64 || !fileName) {
        throw new ApiError('File tidak lengkap', 400)
      }

      // Batas ukuran ~5MB (base64 lebih besar ~33% dari file asli)
      const approxBytes = Math.ceil((fileBase64.length * 3) / 4)
      if (approxBytes > 5 * 1024 * 1024) {
        throw new ApiError('Ukuran gambar maksimal 5MB', 400)
      }

      const binaryStr = atob(fileBase64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)

      const ext = (fileName.split('.').pop() || 'jpg').toLowerCase()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: upErr } = await withRetry(() =>
        supabaseAdmin.storage
          .from('guide-images')
          .upload(path, bytes, { contentType: contentType || 'image/jpeg', upsert: false })
      )
      if (upErr) handleError(upErr)

      const { data: pub } = supabaseAdmin.storage.from('guide-images').getPublicUrl(path)
      return { success: true, data: { url: pub.publicUrl } }
    } catch (err) {
      console.error('Guides API Error (uploadImage):', err)
      throw err
    }
  },
}

// ================================================
// HANDLER — Vercel serverless function entrypoint
// ================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { method } = req
    const { slug, id, admin, token: queryToken } = req.query
    const body = req.body || {}

    let result

    if (method === 'GET') {
      if (slug) {
        // GET single guide by slug (publik)
        result = await guideApi.getBySlug(slug)
      } else if (id && admin) {
        // GET single guide by ID (admin, butuh token)
        result = await guideApi.getById(queryToken, id)
      } else if (admin) {
        // GET semua guide termasuk draft (admin, butuh token)
        result = await guideApi.getAllAdmin(queryToken)
      } else {
        // GET all published guides (publik)
        result = await guideApi.getAll(req.query)
      }
    } else if (method === 'POST') {
      // FIX: action harus diambil dari BODY, bukan dari req.query
      // (frontend ngirim action di dalam JSON body, bukan sebagai query param)
      const { token, action: bodyAction, ...rest } = body

      if (bodyAction === 'uploadImage') {
        // UPLOAD featured image
        result = await guideApi.uploadImage(token, rest)
      } else if (rest.id) {
        // UPDATE existing guide
        const { id, ...updateData } = rest
        result = await guideApi.update(token, id, updateData)
      } else {
        // CREATE new guide
        result = await guideApi.create(token, rest)
      }
    } else if (method === 'PUT') {
      const { token, id, ...rest } = body
      result = await guideApi.update(token, id, rest)
    } else if (method === 'DELETE') {
      const { token, id } = body
      result = await guideApi.delete(token, id)
    } else {
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      })
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('Guides API Error:', err)
    const status = err.status || (err.code === 'PGRST116' ? 404 : 500)
    return res.status(status).json({
      success: false,
      error: err.message || 'Terjadi kesalahan server'
    })
  }
}
