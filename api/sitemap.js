// /api/sitemap.js
import { createClient } from '@supabase/supabase-js'

const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SECRET_KEY
)

const BASE_URL = 'https://myexora.com'

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/showcase', priority: '0.8', changefreq: 'daily' },
  { path: '/blog', priority: '0.6', changefreq: 'weekly' },
  { path: '/guides', priority: '0.6', changefreq: 'weekly' },
  { path: '/syarat-layanan', priority: '0.3', changefreq: 'monthly' },
  { path: '/kebijakan-privasi', priority: '0.3', changefreq: 'monthly' },
]

function escapeXml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default async function handler(req, res) {
  try {
    const { data: tokos, error } = await supabasePublic
      .from('toko')
      .select('slug, updated_at')
      .eq('aktif', true)

    if (error) throw error

    const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${BASE_URL}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

    const tokoUrls = (tokos || []).map(t => `
  <url>
    <loc>${BASE_URL}/${escapeXml(t.slug)}</loc>
    <lastmod>${t.updated_at ? new Date(t.updated_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${tokoUrls}
</urlset>`

    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).send(xml)
  } catch (err) {
    console.error('sitemap.js error:', err)
    return res.status(500).send('<?xml version="1.0"?><error>Failed to generate sitemap</error>')
  }
}
