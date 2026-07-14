import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Search, Clock, ChevronLeft, ChevronRight, ArrowLeft,
  FileText, Loader2, X, CheckCircle, BookOpen,
  ChevronDown, ChevronUp, Filter
} from 'lucide-react'
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const PJS = "'Plus Jakarta Sans', sans-serif"
const NAVY = '#0C447C'
const BLUE = '#378ADD'
const ACCENT_GRADIENT = `linear-gradient(90deg, ${NAVY}, ${BLUE})`

const CATEGORIES = [
  { value: null, label: 'Semua', color: '#6B7280' },
  { value: 'Setup Toko', label: 'Setup Toko', color: '#3B82F6' },
  { value: 'Manajemen Produk', label: 'Produk', color: '#10B981' },
  { value: 'Pemesanan', label: 'Pemesanan', color: '#F59E0B' },
  { value: 'Marketing', label: 'Marketing', color: '#8B5CF6' },
  { value: 'Analytics', label: 'Analytics', color: '#EC4899' },
]

const LEVELS = [
  { value: null, label: 'Semua Level', icon: '🎯' },
  { value: 'beginner', label: 'Beginner', icon: '🔰' },
  { value: 'intermediate', label: 'Intermediate', icon: '⚡' },
  { value: 'advanced', label: 'Advanced', icon: '' },
]

const DURATIONS = [
  { value: null, label: 'Semua Durasi' },
  { value: 'short', label: '< 5 min', max: 5 },
  { value: 'medium', label: '5-15 min', min: 5, max: 15 },
  { value: 'long', label: '> 15 min', min: 15 },
]

// ================================================
// HELPERS
// ================================================

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

function generateTOC(html) {
  if (!html) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h2, h3')
  const toc = []
  headings.forEach((h, index) => {
    const id = `step-${index}`
    h.id = id
    toc.push({ id, text: h.textContent, level: h.tagName === 'H2' ? 2 : 3 })
  })
  return toc
}

// ================================================
// SKELETON
// ================================================

function SkeletonCard() {
  return (
    <div style={{
      border: '3px solid var(--glass-border)',
      borderRadius: '16px',
      overflow: 'hidden',
      background: 'var(--bg-secondary)',
      height: 280,
    }}>
      <div style={{ height: 140, background: 'var(--surface)' }} />
      <div style={{ padding: '16px' }}>
        <div style={{ height: 12, width: 80, background: 'var(--surface)', borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 18, width: '90%', background: 'var(--surface)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 12, width: '100%', background: 'var(--surface)', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 12, width: '60%', background: 'var(--surface)', borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ================================================
// CATEGORY BADGE
// ================================================

function CategoryBadge({ category }) {
  const cat = CATEGORIES.find(c => c.value === category)
  const color = cat?.color || '#6B7280'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${color}20`,
      border: `1px solid ${color}40`,
      borderRadius: 'var(--radius-full)',
      padding: '4px 10px',
      fontFamily: PJS, fontSize: '0.72rem', fontWeight: 700, color: color,
    }}>
      {cat?.label || category}
    </span>
  )
}

function LevelBadge({ level }) {
  const lvl = LEVELS.find(l => l.value === level)
  const colors = { beginner: '#10B981', intermediate: '#F59E0B', advanced: '#EF4444' }
  const color = colors[level] || '#6B7280'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: PJS, fontSize: '0.72rem', fontWeight: 700, color: color,
    }}>
      {lvl?.icon} {lvl?.label || level}
    </span>
  )
}

// ================================================
// GUIDE CARD
// ================================================

function GuideCard({ guide, index }) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => { if (isInView) controls.start('visible') }, [controls, isInView])

  return (
   <motion.article
  ref={ref}
  variants={{
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  }}
  initial="hidden"
  animate={controls}
  transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
  whileHover={{ y: -4 }}
>
      <Link to={`/guides/${guide.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{
          border: '3px solid var(--glass-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          height: '100%',
          display: 'flex', flexDirection: 'column',
        }}>
          {guide.featured_image ? (
            <div style={{ height: 160, overflow: 'hidden', background: 'var(--surface)' }}>
              <img src={guide.featured_image} alt={guide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{
              height: 160, background: 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)',
            }}>
              <BookOpen size={32} opacity={0.3} />
            </div>
          )}
          
          <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <CategoryBadge category={guide.category} />
              <LevelBadge level={guide.level} />
            </div>
            
            <h3 style={{
              fontFamily: PJS, fontWeight: 800, fontSize: '1.1rem',
              color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.3,
            }}>
              {guide.title}
            </h3>
            
            {guide.excerpt && (
              <p style={{
                fontFamily: PJS, fontSize: '0.875rem', color: 'var(--text-secondary)',
                lineHeight: 1.5, margin: '0 0 16px 0', flex: 1,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {guide.excerpt}
              </p>
            )}
            
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              fontFamily: PJS, fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600,
              borderTop: '1px solid var(--glass-border)', paddingTop: 12,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {guide.duration_minutes} min
              </span>
              {guide.steps_count > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={12} /> {guide.steps_count} langkah
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

// ================================================
// TABLE OF CONTENTS
// ================================================

function TableOfContents({ toc, activeId }) {
  if (!toc.length) return null
  
  return (
    <div style={{
      position: 'sticky', top: 100,
      background: 'var(--bg-secondary)',
      border: '2px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
    }}>
      <h4 style={{ fontFamily: PJS, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
        Daftar Isi
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toc.map(item => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            style={{
              fontFamily: PJS,
              fontSize: item.level === 2 ? '0.82rem' : '0.75rem',
              fontWeight: activeId === item.id ? 700 : 500,
              color: activeId === item.id ? 'var(--accent)' : 'var(--text-secondary)',
              textDecoration: 'none',
              paddingLeft: item.level === 3 ? 16 : 0,
              transition: 'all 0.2s ease',
              borderLeft: activeId === item.id ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {item.text}
          </a>
        ))}
      </div>
    </div>
  )
}

// ================================================
// MAIN PAGE
// ================================================

export default function GuidesPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [guides, setGuides] = useState([])
  const [currentGuide, setCurrentGuide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ category: null, level: null, duration: null })
  const [toc, setToc] = useState([])
  const [activeTocId, setActiveTocId] = useState('')
  const [showMobileToc, setShowMobileToc] = useState(false)

  useEffect(() => {
    if (slug) fetchGuide(slug)
    else fetchGuides()
    window.scrollTo(0, 0)
  }, [slug])

  // Intersection Observer untuk TOC
  useEffect(() => {
    if (!slug || !toc.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveTocId(entry.target.id)
        })
      },
      { rootMargin: '-100px 0px -70% 0px' }
    )
    toc.forEach(item => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [slug, toc])

  const fetchGuides = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.level) params.append('level', filters.level)
      
      const res = await fetch(`/api/guides?${params.toString()}`)
      const json = await res.json()
      if (json.success) setGuides(json.data || [])
    } catch (err) {
      toast.error('Gagal memuat panduan')
    } finally {
      setLoading(false)
    }
  }

  const fetchGuide = async (slug) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/guides?slug=${slug}`)
      const json = await res.json()
      if (json.success) {
        setCurrentGuide(json.data)
        const newToc = generateTOC(json.data.content)
        setToc(newToc)
      }
    } catch (err) {
      setCurrentGuide(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGuides() }, [filters])

  // Filter logic
  const filteredGuides = guides.filter(g => {
    const matchSearch = !searchQuery || 
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stripHtml(g.content).toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchDuration = true
    if (filters.duration) {
      const dur = DURATIONS.find(d => d.value === filters.duration)
      if (dur.max) matchDuration = g.duration_minutes <= dur.max
      if (dur.min) matchDuration = g.duration_minutes >= dur.min
      if (dur.min && dur.max) matchDuration = g.duration_minutes >= dur.min && g.duration_minutes <= dur.max
    }
    
    return matchSearch && matchDuration
  })

  // ================================================
  // DETAIL VIEW
  // ================================================
  if (slug) {
    if (loading) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
        </div>
      )
    }

    if (!currentGuide) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontFamily: PJS, color: 'var(--text-secondary)', marginBottom: 24 }}>Panduan tidak ditemukan</p>
          <button onClick={() => navigate('/guides')} style={{ background: ACCENT_GRADIENT, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 'var(--radius-full)', fontFamily: PJS, fontWeight: 700, cursor: 'pointer' }}>
            Kembali ke Panduan
          </button>
        </div>
      )
    }

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: PJS }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }

          .guide-content h2 { font-size: 1.5rem; font-weight: 800; margin: 2em 0 1em 0; color: var(--text-primary); scroll-margin-top: 100px; }
          .guide-content h3 { font-size: 1.2rem; font-weight: 700; margin: 1.5em 0 0.8em 0; color: var(--text-primary); scroll-margin-top: 100px; }
          .guide-content p { margin: 1em 0; line-height: 1.8; color: var(--text-secondary); }
          .guide-content ul, .guide-content ol { padding-left: 1.5em; margin: 1em 0; color: var(--text-secondary); }
          .guide-content li { margin: 0.5em 0; line-height: 1.7; }
          .guide-content img { max-width: 100%; height: auto; border-radius: var(--radius-lg); margin: 1.5em 0; border: 2px solid var(--glass-border); }
          .guide-content blockquote { border-left: 4px solid var(--accent); padding: 1em; margin: 1.5em 0; background: var(--surface); border-radius: var(--radius-md); font-style: italic; }
          .guide-content code { background: var(--surface); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
          .guide-content pre { background: var(--surface); padding: 1em; border-radius: var(--radius-md); overflow-x: auto; border: 2px solid var(--glass-border); }
          .guide-content a { color: var(--accent); text-decoration: underline; font-weight: 600; }
          .guide-content strong { font-weight: 800; color: var(--text-primary); }

          /* Detail layout: 1 kolom di mobile, 2 kolom (content + TOC) di desktop */
          .guide-detail-layout {
            max-width: 1200px;
            margin: 0 auto;
            padding: 32px 20px;
            display: grid;
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .guide-detail-toc {
            display: none;
          }
          @media (min-width: 1024px) {
            .guide-detail-layout {
              grid-template-columns: 1fr 280px;
            }
            .guide-detail-toc {
              display: block;
            }
          }
        `}</style>

        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'var(--bg-header, rgba(11,11,16,0.85))',
          backdropFilter: 'blur(20px)',
          borderBottom: '3px solid var(--glass-border)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={() => navigate('/guides')} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: PJS, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Kembali
          </button>
          {toc.length > 0 && (
            <button onClick={() => setShowMobileToc(!showMobileToc)} style={{ background: 'var(--surface)', border: '2px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '6px 12px', color: 'var(--text-secondary)', fontFamily: PJS, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={14} /> Daftar Isi
            </button>
          )}
        </div>

        {/* Mobile TOC Modal */}
        <AnimatePresence>
          {showMobileToc && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMobileToc(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 400, background: 'var(--bg-secondary)', border: '2px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: 24, maxHeight: '80vh', overflowY: 'auto' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: PJS, fontWeight: 800, margin: 0 }}>Daftar Isi</h3>
                  <button onClick={() => setShowMobileToc(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <TableOfContents toc={toc} activeId={activeTocId} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Layout */}
        <div className="guide-detail-layout">
          <div style={{ minWidth: 0 }}>
            {/* Guide Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginBottom: 16 }}>
                <CategoryBadge category={currentGuide.category} />
              </div>
              <h1 style={{ fontFamily: PJS, fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: 'var(--text-primary)', margin: '0 0 16px 0', lineHeight: 1.2 }}>
                {currentGuide.title}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, fontFamily: PJS, fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> {currentGuide.duration_minutes} menit</span>
                <LevelBadge level={currentGuide.level} />
                {currentGuide.steps_count > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> {currentGuide.steps_count} langkah</span>}
              </div>
              {currentGuide.featured_image && (
                <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 32, border: '3px solid var(--glass-border)' }}>
                  <img src={currentGuide.featured_image} alt={currentGuide.title} style={{ width: '100%', display: 'block' }} />
                </div>
              )}
            </motion.div>

            {/* Main Content */}
            <motion.article
              className="guide-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              dangerouslySetInnerHTML={{ __html: currentGuide.content }}
            />
          </div>

          {/* Desktop TOC Sidebar */}
          <div className="guide-detail-toc">
            <TableOfContents toc={toc} activeId={activeTocId} />
          </div>
        </div>
      </div>
    )
  }

  // ================================================
  // LIST VIEW
  // ================================================
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: PJS }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .guides-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        @media (max-width: 640px) {
          .guides-grid { grid-template-columns: 1fr !important; }
          .filter-scroll { overflow-x: auto !important; flex-wrap: nowrap !important; padding-bottom: 8px; }
          .filter-scroll::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--bg-header, rgba(11,11,16,0.85))',
        backdropFilter: 'blur(20px)',
        borderBottom: '3px solid var(--glass-border)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontFamily: PJS, fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Panduan <span style={{ color: 'var(--accent)' }}>Exora</span>
        </h1>
        <Link to="/" style={{ background: ACCENT_GRADIENT, color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius-full)', fontFamily: PJS, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
          Buka Toko
        </Link>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: PJS, fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
            Pelajari Cara Jualan di Exora
          </h2>
          <p style={{ fontFamily: PJS, fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>
            Tutorial step-by-step untuk membantu kamu sukses berjualan online
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 32 }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Cari tutorial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 40px',
                background: 'var(--surface)', border: '2px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)',
                fontFamily: PJS, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category Pills */}
          <div className="filter-scroll" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value || 'all'}
                onClick={() => setFilters({ ...filters, category: cat.value })}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-full)',
                  background: filters.category === cat.value ? cat.color : 'var(--surface)',
                  color: filters.category === cat.value ? '#fff' : 'var(--text-secondary)',
                  border: `2px solid ${filters.category === cat.value ? cat.color : 'var(--glass-border)'}`,
                  fontFamily: PJS, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Level & Duration */}
          <div className="filter-scroll" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LEVELS.map(lvl => (
              <button
                key={lvl.value || 'all'}
                onClick={() => setFilters({ ...filters, level: lvl.value })}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-md)',
                  background: filters.level === lvl.value ? 'var(--accent-gradient-soft)' : 'var(--surface)',
                  color: filters.level === lvl.value ? 'var(--accent)' : 'var(--text-tertiary)',
                  border: `1px solid ${filters.level === lvl.value ? 'var(--accent)' : 'var(--glass-border)'}`,
                  fontFamily: PJS, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {lvl.icon} {lvl.label}
              </button>
            ))}
            {DURATIONS.map(dur => (
              <button
                key={dur.value || 'all'}
                onClick={() => setFilters({ ...filters, duration: dur.value })}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-md)',
                  background: filters.duration === dur.value ? 'var(--accent-gradient-soft)' : 'var(--surface)',
                  color: filters.duration === dur.value ? 'var(--accent)' : 'var(--text-tertiary)',
                  border: `1px solid ${filters.duration === dur.value ? 'var(--accent)' : 'var(--glass-border)'}`,
                  fontFamily: PJS, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="guides-grid">
            {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredGuides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <BookOpen size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <p style={{ fontFamily: PJS, color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 700 }}>Tidak ada panduan yang cocok</p>
            <p style={{ fontFamily: PJS, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="guides-grid">
            {filteredGuides.map((guide, index) => (
              <GuideCard key={guide.id} guide={guide} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
