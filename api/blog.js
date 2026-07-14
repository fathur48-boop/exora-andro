// ================================================
// /api/blog.js — SERVERLESS FUNCTION untuk Blog/Seller Hub
// ================================================

import { createClient } from '@supabase/supabase-js'

// Check environment variables
if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('ENV MISSING: SUPABASE_URL atau SERVICE_ROLE_KEY belum diset!')
}

// Initialize Supabase Admin Client (sama persis kayak admin.js)
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
      console.warn(`Blog API: transient network error, retry ke-${attempt + 1}...`, err.message)
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
// BLOG API METHODS
// ================================================

const blogApi = {
  // GET: List artikel PUBLISHED saja (untuk publik / halaman blog biasa)
  getAll: async () => {
    try {
      const { data, error } = await withRetry(() =>
        supabaseAdmin
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
      )

      if (error) handleError(error)
      return { success: true, data: data || [] }
    } catch (err) {
      console.error('Blog API Error (getAll):', err)
      throw err
    }
  },

  // GET: List SEMUA artikel termasuk draft (khusus admin, wajib token)
  getAllAdmin: async (token) => {
    try {
      await verifyAdminToken(token)

      const { data, error } = await withRetry(() =>
        supabaseAdmin
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false })
      )

      if (error) handleError(error)
      return { success: true, data: data || [] }
    } catch (err) {
      console.error('Blog API Error (getAllAdmin):', err)
      throw err
    }
  },

  // GET: Single artikel by slug
  getBySlug: async (slug) => {
    try {
      const { data: post, error } = await withRetry(() =>
        supabaseAdmin
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single()
      )

      if (error) handleError(error)
      if (!post) throw new ApiError('Artikel tidak ditemukan', 404)

      const { error: updateError } = await withRetry(() =>
        supabaseAdmin
          .from('blog_posts')
          .update({
            view_count: (post.view_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id)
      )

      if (updateError) console.warn('Failed to increment view count:', updateError)

      return { success: true, data: post }
    } catch (err) {
      console.error('Blog API Error (getBySlug):', err)
      throw err
    }
  },

  // GET: Single artikel by ID (untuk admin — wajib token)
  getById: async (token, id) => {
    try {
      await verifyAdminToken(token)

      const { data, error } = await withRetry(() =>
        supabaseAdmin
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single()
      )

      if (error) handleError(error)
      if (!data) throw new ApiError('Artikel tidak ditemukan', 404)

      return { success: true, data }
    } catch (err) {
      console.error('Blog API Error (getById):', err)
      throw err
    }
  },

  // CREATE: Artikel baru (wajib token admin)
  create: async (token, data) => {
    try {
      await verifyAdminToken(token)

      const slug = data.slug || data.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80)

      const { data: post, error } = await withRetry(() =>
        supabaseAdmin
          .from('blog_posts')
          .insert({
            title: data.title,
            slug: slug,
            excerpt: data.excerpt || '',
            content: data.content,
            category: data.category || 'Tips & Trik',
            author: data.author || 'Exora Team',
            featured_image: data.featured_image || '',
            is_published: data.is_published || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
      )

      if (error) handleError(error)
      return { success: true, data: post }
    } catch (err) {
      console.error('Blog API Error (create):', err)
      throw err
    }
  },

  // UPDATE: Artikel existing (wajib token admin)
  update: async (token, id, data) => {
    try {
      await verifyAdminToken(token)

      const slug = data.slug || data.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80)

      const { data: post, error } = await withRetry(() =>
        supabaseAdmin
          .from('blog_posts')
          .update({
            title: data.title,
            slug: slug,
            excerpt: data.excerpt,
            content: data.content,
            category: data.category,
            author: data.author,
            featured_image: data.featured_image,
            is_published: data.is_published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()
      )

      if (error) handleError(error)
      return { success: true, data: post }
    } catch (err) {
      console.error('Blog API Error (update):', err)
      throw err
    }
  },

  // DELETE: Hapus artikel (wajib token admin)
  delete: async (token, id) => {
    try {
      await verifyAdminToken(token)

      const { error } = await withRetry(() =>
        supabaseAdmin
          .from('blog_posts')
          .delete()
          .eq('id', id)
      )

      if (error) handleError(error)
      return { success: true }
    } catch (err) {
      console.error('Blog API Error (delete):', err)
      throw err
    }
  },

  // UPLOAD: Featured image artikel (wajib token admin)
  // Terima base64 dari frontend, upload ke bucket 'blog-images', balikin public URL.
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
          .from('blog-images')
          .upload(path, bytes, { contentType: contentType || 'image/jpeg', upsert: false })
      )
      if (upErr) handleError(upErr)

      const { data: pub } = supabaseAdmin.storage.from('blog-images').getPublicUrl(path)
      return { success: true, data: { url: pub.publicUrl } }
    } catch (err) {
      console.error('Blog API Error (uploadImage):', err)
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
        // GET single post by slug (publik)
        result = await blogApi.getBySlug(slug)
      } else if (id && admin) {
        // GET single post by ID (admin, butuh token)
        result = await blogApi.getById(queryToken, id)
      } else if (admin) {
        // GET semua post termasuk draft (admin, butuh token)
        result = await blogApi.getAllAdmin(queryToken)
      } else {
        // GET all published posts (publik)
        result = await blogApi.getAll()
      }
    } else if (method === 'POST') {
      // FIX: action harus diambil dari BODY, bukan dari req.query
      // (frontend ngirim action di dalam JSON body, bukan sebagai query param)
      const { token, action: bodyAction, ...rest } = body

      if (bodyAction === 'uploadImage') {
        // UPLOAD featured image
        result = await blogApi.uploadImage(token, rest)
      } else if (rest.id) {
        // UPDATE existing post
        const { id, ...updateData } = rest
        result = await blogApi.update(token, id, updateData)
      } else {
        // CREATE new post
        result = await blogApi.create(token, rest)
      }
    } else if (method === 'PUT') {
      const { token, id, ...rest } = body
      result = await blogApi.update(token, id, rest)
    } else if (method === 'DELETE') {
      const { token, id } = body
      result = await blogApi.delete(token, id)
    } else {
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      })
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('Blog API Error:', err)
    const status = err.status || (err.code === 'PGRST116' ? 404 : 500)
    return res.status(status).json({
      success: false,
      error: err.message || 'Terjadi kesalahan server'
    })
  }
}
