import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Search, Calendar, User, Eye, Clock, ArrowLeft,
  Tag, Share2, Copy, Check, Loader2, FileText,
  ChevronDown, ChevronUp, X, Maximize2,
  ChevronLeft, ChevronRight, Sparkles, ArrowUp
} from 'lucide-react'
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const PJS = "'Plus Jakarta Sans', sans-serif"
const NAVY = '#0C447C'
const BLUE = '#378ADD'
const ACCENT_GRADIENT = `linear-gradient(90deg, ${NAVY}, ${BLUE})`

const CATEGORIES = [
  { value: null, label: 'Semua', emoji: '📚' },
  { value: 'Tips & Trik', label: 'Tips & Trik', emoji: '💡' },
  { value: 'Panduan', label: 'Panduan', emoji: '📖' },
  { value: 'Kisah Sukses', label: 'Kisah Sukses', emoji: '🏆' },
  { value: 'Update Fitur', label: 'Update Fitur', emoji: '🚀' },
]

// ================================================
// HELPERS
// ================================================

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}dtk`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`
  return `${Math.floor(diff / 86400)}h`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatViews(count) {
  if (!count) return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

function readingTime(content) {
  if (!content) return 1
  const text = content.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

// ================================================
// SKELETON
// ================================================

function SkeletonCard({ featured = false }) {
  return (
    <div style={{
      border: '3px solid var(--glass-border)',
      borderRadius: '16px',
      overflow: 'hidden',
      background: 'var(--bg-secondary)',
      marginBottom: '16px',
    }}>
      <div style={{
        height: featured ? 240 : 180,
        background: 'var(--surface)',
      }} />
      <div style={{ padding: '16px' }}>
        <div style={{ height: 12, width: 80, background: 'var(--surface)', borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 18, width: '90%', background: 'var(--surface)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 18, width: '60%', background: 'var(--surface)', borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 12, width: '100%', background: 'var(--surface)', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 12, width: '80%', background: 'var(--surface)', borderRadius: 4, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ height: 10, width: 80, background: 'var(--surface)', borderRadius: 4 }} />
          <div style={{ height: 10, width: 60, background: 'var(--surface)', borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )
}

// ================================================
// IMAGE LIGHTBOX
// ================================================

function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => { e.stopPropagation(); onClose() }}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 38, height: 38, borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 2,
        }}
      >
        <X size={18} color="#fff" />
      </motion.button>
      <motion.img
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '92vw', maxHeight: '88vh',
          objectFit: 'contain',
          borderRadius: 8,
        }}
      />
    </motion.div>
  )
}

// ================================================
// SHARE BUTTONS
// ================================================

function ShareButtons({ post }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = post?.title || ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link disalin!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin link')
    }
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareTitle}\n\n${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '14px 0',
      borderTop: '2px solid var(--glass-border)',
      marginTop: 24,
    }}>
      <span style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', marginRight: 8 }}>
        Bagikan:
      </span>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleWhatsApp}
        style={{
          width: 36, height: 36, borderRadius: 'var(--radius-full)',
          background: '#25D366', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Share2 size={16} color="#fff" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        style={{
          width: 36, height: 36, borderRadius: 'var(--radius-full)',
          background: copied ? 'var(--success, #10B981)' : 'var(--surface)',
          border: '2px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: copied ? '#fff' : 'var(--text-secondary)',
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </motion.button>
    </div>
  )
}

// ================================================
// CATEGORY BADGE
// ================================================

function CategoryBadge({ category, size = 'normal' }) {
  const cat = CATEGORIES.find(c => c.value === category)
  const emoji = cat?.emoji || '📄'
  const label = category || 'Artikel'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'var(--accent-gradient-soft, rgba(55,138,221,0.1))',
      border: '2px solid var(--glass-border)',
      borderRadius: 'var(--radius-md)',
      padding: size === 'small' ? '2px 8px' : '4px 10px',
      fontFamily: PJS,
      fontSize: size === 'small' ? '0.68rem' : '0.72rem',
      fontWeight: 700,
      color: 'var(--accent, #378ADD)',
    }}>
      <span>{emoji}</span>
      {label}
    </span>
  )
}

// ================================================
// ARTICLE CARD
// ================================================

function ArticleCard({ post, index, featured = false, onImageClick }) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (isInView) controls.start('visible')
  }, [controls, isInView])

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1, y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  // FIX: Extract first, then slice
  const rawExcerpt = post.excerpt || stripHtml(post.content)
  const excerpt = rawExcerpt.slice(0, featured ? 160 : 100)
  const readTime = readingTime(post.content)

  return (
    <motion.article
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      whileHover={{ y: -4 }}
      // NOTE: no fixed width here — the parent grid (.blog-grid) controls sizing.
      style={{ minWidth: 0 }}
    >
      <Link
        to={`/blog/${post.slug}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <div style={{
          border: '3px solid var(--glass-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.08))',
          transition: 'box-shadow 0.2s ease',
        }}>
          {post.featured_image && (
            <div
              onClick={(e) => {
                e.preventDefault()
                onImageClick(post.featured_image)
              }}
              style={{
                height: featured ? 240 : 180,
                overflow: 'hidden',
                background: 'var(--surface)',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <img
                src={post.featured_image}
                alt={post.title}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              />
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                width: 28, height: 28, borderRadius: 'var(--radius-full)',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <Maximize2 size={13} color="#fff" />
              </div>
            </div>
          )}

          <div style={{ padding: featured ? '20px' : '16px' }}>
            <div style={{ marginBottom: 10 }}>
              <CategoryBadge category={post.category} size={featured ? 'normal' : 'small'} />
            </div>

            <h3 style={{
              fontFamily: PJS,
              fontWeight: 800,
              fontSize: featured ? '1.4rem' : '1.1rem',
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
            }}>
              {post.title}
            </h3>

            {excerpt && (
              <p style={{
                fontFamily: PJS,
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 12px 0',
              }}>
                {excerpt}{!post.excerpt && stripHtml(post.content).length > (featured ? 160 : 100) ? '...' : ''}
              </p>
            )}

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 12,
              fontFamily: PJS,
              fontSize: '0.72rem',
              color: 'var(--text-tertiary)',
              fontWeight: 600,
            }}>
              {post.author && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={12} /> {post.author}
                </span>
              )}
              {post.created_at && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> {timeAgo(post.created_at)}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {readTime} min
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Eye size={12} /> {formatViews(post.view_count)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

// ================================================
// ARTICLE DETAIL
// ================================================

function ArticleDetail({ post, loading, onBack, onImageClick }) {
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="blog-detail-container" style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--accent)' }} />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="blog-detail-container" style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 60 }}
        >
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-tertiary)' }} />
          <p style={{ fontFamily: PJS, fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8 }}>
            Artikel tidak ditemukan
          </p>
          <p style={{ fontFamily: PJS, fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: 24 }}>
            Artikel yang kamu cari mungkin sudah dihapus atau tidak ada.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            style={{
              background: ACCENT_GRADIENT,
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              fontFamily: PJS,
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={14} /> Kembali ke Blog
          </motion.button>
        </motion.div>
      </div>
    )
  }

  const readTime = readingTime(post.content)

  return (
    <div className="blog-detail-container" style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: PJS,
          fontSize: '0.875rem',
          fontWeight: 600,
          padding: '8px 0',
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={16} /> Kembali ke Blog
      </motion.button>

      {/* Category */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: 16 }}
      >
        <CategoryBadge category={post.category} />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        style={{
          fontFamily: PJS,
          fontWeight: 800,
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          color: 'var(--text-primary)',
          margin: '0 0 16px 0',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}
      >
        {post.title}
      </motion.h1>

      {/* Excerpt */}
      {post.excerpt && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: PJS,
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 24px 0',
            fontStyle: 'italic',
          }}
        >
          {post.excerpt}
        </motion.p>
      )}

      {/* Meta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 16,
          padding: '16px 0',
          borderTop: '2px solid var(--glass-border)',
          borderBottom: '2px solid var(--glass-border)',
          marginBottom: 24,
          fontFamily: PJS,
          fontSize: '0.78rem',
          color: 'var(--text-tertiary)',
          fontWeight: 600,
        }}
      >
        {post.author && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={14} /> {post.author}
          </span>
        )}
        {post.created_at && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} /> {formatDate(post.created_at)}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} /> {readTime} min baca
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={14} /> {formatViews(post.view_count)} views
        </span>
      </motion.div>

      {/* Featured Image */}
      {post.featured_image && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onImageClick(post.featured_image)}
          style={{
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            marginBottom: 32,
            border: '3px solid var(--glass-border)',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <img
            src={post.featured_image}
            alt={post.title}
            style={{ width: '100%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            width: 36, height: 36, borderRadius: 'var(--radius-full)',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Maximize2 size={16} color="#fff" />
          </div>
        </motion.div>
      )}

      {/* Content */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="blog-content"
        style={{
          fontFamily: PJS,
          fontSize: '1.05rem',
          lineHeight: 1.8,
          color: 'var(--text-secondary)',
        }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Share */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <ShareButtons post={post} />
      </motion.div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-full)',
              background: ACCENT_GRADIENT,
              border: 'none',
              boxShadow: '0 4px 16px rgba(55,138,221,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 50,
            }}
          >
            <ArrowUp size={20} color="#fff" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ================================================
// MAIN BLOG PAGE
// ================================================

export default function BlogPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [posts, setPosts] = useState([])
  const [currentPost, setCurrentPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchMode, setSearchMode] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [lightboxImg, setLightboxImg] = useState(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Scroll progress
  useEffect(() => {
    const fn = () => {
      const scrollY = window.scrollY
      const scrollTotal = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollTotal > 0 ? (scrollY / scrollTotal) * 100 : 0
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Fetch posts
  useEffect(() => {
    if (slug) {
      fetchPostBySlug(slug)
    } else {
      fetchPosts()
    }
    window.scrollTo(0, 0)
  }, [slug])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/blog')
      const json = await res.json()
      if (json.success) {
        setPosts(json.data || [])
      } else {
        throw new Error(json.error || 'Gagal memuat artikel')
      }
    } catch (err) {
      console.error('Fetch blog error:', err)
      toast.error('Gagal memuat artikel: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPostBySlug = async (slug) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/blog?slug=${slug}`)
      const json = await res.json()
      if (json.success) {
        setCurrentPost(json.data)
      } else {
        throw new Error(json.error || 'Artikel tidak ditemukan')
      }
    } catch (err) {
      console.error('Fetch post error:', err)
      setCurrentPost(null)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/blog')
  }

  const handleCategoryClick = (catValue) => {
    setActiveCategory(catValue === activeCategory ? null : catValue)
  }

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchCategory = !activeCategory || post.category === activeCategory
    const matchSearch = !searchInput ||
      post.title?.toLowerCase().includes(searchInput.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchInput.toLowerCase()) ||
      stripHtml(post.content).toLowerCase().includes(searchInput.toLowerCase())
    return matchCategory && matchSearch
  })

  // Featured post = first published post
  const featuredPost = filteredPosts[0] || null
  const otherPosts = filteredPosts.slice(1)

  // Related posts (for detail view)
  const relatedPosts = slug
    ? posts
        .filter(p => p.slug !== slug && p.category === currentPost?.category)
        .slice(0, 3)
    : []

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0b0b10)',
      fontFamily: PJS,
      transition: 'background 0.25s ease',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .float-animation { animation: float 3s ease-in-out infinite; }

        .blog-content h1, .blog-content h2, .blog-content h3 {
          font-family: ${PJS};
          font-weight: 800;
          color: var(--text-primary, #f5f5f7);
          margin: 1.5em 0 0.5em 0;
          line-height: 1.3;
        }
        .blog-content h1 { font-size: 1.8rem; }
        .blog-content h2 { font-size: 1.4rem; }
        .blog-content h3 { font-size: 1.15rem; }
        .blog-content p {
          margin: 0.8em 0;
          line-height: 1.8;
        }
        .blog-content ul, .blog-content ol {
          padding-left: 1.5em;
          margin: 0.8em 0;
        }
        .blog-content li {
          margin: 0.3em 0;
          line-height: 1.7;
        }
        .blog-content a {
          color: var(--accent, #378ADD);
          text-decoration: underline;
          font-weight: 600;
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-lg, 12px);
          margin: 1em 0;
          border: 2px solid var(--glass-border);
        }
        .blog-content blockquote {
          border-left: 4px solid var(--accent, #378ADD);
          padding: 0.5em 1em;
          margin: 1em 0;
          background: var(--surface, #15151c);
          border-radius: var(--radius-md, 8px);
          font-style: italic;
        }
        .blog-content code {
          background: var(--surface, #15151c);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .blog-content pre {
          background: var(--surface, #15151c);
          padding: 1em;
          border-radius: var(--radius-md, 8px);
          overflow-x: auto;
          border: 2px solid var(--glass-border);
        }
        .blog-content pre code {
          background: none;
          padding: 0;
        }
        .blog-content strong { font-weight: 800; color: var(--text-primary); }
        .blog-content em { font-style: italic; }
        .blog-content hr {
          border: none;
          border-top: 2px solid var(--glass-border);
          margin: 2em 0;
        }

        /* ==========================================================
           LAYOUT — mobile-first, fully fluid, no fixed inline widths.
           The grid auto-fits columns based on available space, so it
           does not need per-breakpoint column-count overrides.
           ========================================================== */
        .blog-list-container,
        .blog-detail-container {
          width: 100%;
          box-sizing: border-box;
          padding: 24px 16px 80px;
          margin: 0 auto;
          max-width: 680px; /* comfortable reading width by default */
        }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 340px));
          gap: 16px;
          width: 100%;
          justify-content: center;
        }

        .blog-featured-card {
          width: 100%;
          max-width: 700px;
          margin: 0 auto 24px;
        }

        .blog-category-pills {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          padding-bottom: 4px;
          overflow-x: auto;
        }
        .blog-category-pills::-webkit-scrollbar { display: none; }

        @media (min-width: 641px) {
          .blog-category-pills { flex-wrap: wrap; overflow-x: visible; justify-content: center; }
        }

        /* Widen the reading container on larger screens so the grid
           actually has room to lay out 2-3 columns. */
        @media (min-width: 900px) {
          .blog-list-container { max-width: 980px; }
        }
        @media (min-width: 1200px) {
          .blog-list-container { max-width: 1200px; }
        }
      `}</style>

      {/* Scroll Progress Bar */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0,
        height: '3px',
        background: ACCENT_GRADIENT,
        width: `${scrollProgress}%`,
        zIndex: 101,
        transition: 'width 0.1s ease-out',
        boxShadow: '0 0 10px rgba(55, 138, 221, 0.5)',
      }} />

      {/* Sticky Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'var(--bg-header, rgba(11,11,16,0.85))',
          backdropFilter: 'blur(20px)',
          borderBottom: '3px solid var(--glass-border)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background 0.25s ease',
        }}
      >
        <motion.h1
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/blog')}
          style={{
            fontFamily: PJS,
            fontSize: '1.2rem',
            fontWeight: 800,
            margin: 0,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            cursor: 'pointer',
          }}
        >
          Seller Hub <span style={{ color: 'var(--accent, #378ADD)' }}>Exora</span>
        </motion.h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {searchMode ? (
            <>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{
                  position: 'absolute', left: 11, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none',
                }} />
                <input
                  autoFocus
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setSearchMode(false); setSearchInput('') } }}
                  placeholder="Cari artikel..."
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '2px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '8px 12px 8px 32px',
                    color: 'var(--text-primary)',
                    fontSize: '0.83rem',
                    outline: 'none',
                    fontFamily: PJS,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSearchMode(false); setSearchInput('') }}
                style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                }}
              >
                <X size={15} />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchMode(true)}
                style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                }}
              >
                <Search size={15} />
              </motion.button>
              <Link
                to="/"
                style={{
                  background: ACCENT_GRADIENT,
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontFamily: PJS,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(12,68,124,0.18)',
                }}
              >
                Buka Toko
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {/* DETAIL VIEW */}
      {slug ? (
        <>
          <ArticleDetail
            post={currentPost}
            loading={loading}
            onBack={handleBack}
            onImageClick={setLightboxImg}
          />

          {/* Related Articles */}
          {!loading && relatedPosts.length > 0 && (
            <div className="blog-detail-container" style={{ padding: '0 16px 80px' }}>
              <h2 style={{
                fontFamily: PJS,
                fontWeight: 800,
                fontSize: '1.3rem',
                color: 'var(--text-primary)',
                margin: '0 0 20px 0',
                letterSpacing: '-0.02em',
              }}>
                Artikel Terkait
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {relatedPosts.map((post, index) => (
                  <ArticleCard
                    key={post.id}
                    post={post}
                    index={index}
                    onImageClick={setLightboxImg}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* LIST VIEW */
        <div className="blog-list-container">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 32 }}
          >
            <motion.div
              className="float-animation"
              style={{
                width: 56, height: 56, borderRadius: '14px',
                background: 'var(--accent-gradient-soft, rgba(55,138,221,0.1))',
                border: '2px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--accent, #378ADD)',
              }}
            >
              <Sparkles size={24} />
            </motion.div>
            <h2 style={{
              fontFamily: PJS,
              fontWeight: 800,
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}>
              Seller Hub
            </h2>
            <p style={{
              fontFamily: PJS,
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.6,
            }}>
              Tips, trik, dan insight untuk membantu kamu sukses berjualan online
            </p>
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="blog-category-pills"
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.value
              return (
                <motion.button
                  key={cat.value || 'all'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryClick(cat.value)}
                  style={{
                    fontFamily: PJS,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    background: isActive ? ACCENT_GRADIENT : 'var(--surface)',
                    border: `2px solid ${isActive ? 'transparent' : 'var(--glass-border)'}`,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </motion.button>
              )
            })}
          </motion.div>

          {/* Active filter indicator */}
          {(activeCategory || searchInput) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--accent-gradient-soft, rgba(55,138,221,0.1))',
                border: '2px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 14px',
                marginBottom: 16,
              }}
            >
              <span style={{
                fontFamily: PJS,
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--accent)',
              }}>
                {searchInput && `Mencari: "${searchInput}"`}
                {searchInput && activeCategory && ' • '}
                {activeCategory && `Kategori: ${activeCategory}`}
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, marginLeft: 8 }}>
                  ({filteredPosts.length} artikel)
                </span>
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveCategory(null); setSearchInput('') }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: PJS,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <X size={13} /> Reset
              </motion.button>
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <div>
              <SkeletonCard featured />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredPosts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center', padding: '60px 20px' }}
            >
              <motion.div
                className="float-animation"
                style={{
                  width: 56, height: 56, borderRadius: '14px',
                  background: 'var(--accent-gradient-soft, rgba(55,138,221,0.1))',
                  border: '2px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--accent)',
                }}
              >
                <FileText size={24} />
              </motion.div>
              <p style={{
                fontFamily: PJS,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                margin: '0 0 8px 0',
              }}>
                {searchInput || activeCategory ? 'Tidak ada artikel yang cocok' : 'Belum ada artikel'}
              </p>
              <p style={{
                fontFamily: PJS,
                fontSize: '0.875rem',
                color: 'var(--text-tertiary)',
                margin: 0,
              }}>
                {searchInput || activeCategory ? 'Coba ubah kata kunci atau kategori' : 'Stay tuned untuk artikel menarik!'}
              </p>
            </motion.div>
          )}

          {/* Featured Article */}
          {!loading && featuredPost && (
            <div className="blog-featured-card">
              <ArticleCard
                post={featuredPost}
                index={0}
                featured
                onImageClick={setLightboxImg}
              />
            </div>
          )}

          {/* Other Articles Grid */}
          {!loading && otherPosts.length > 0 && (
            <div className="blog-grid">
              {otherPosts.map((post, index) => (
                <ArticleCard
                  key={post.id}
                  post={post}
                  index={index + 1}
                  onImageClick={setLightboxImg}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <ImageLightbox
            src={lightboxImg}
            onClose={() => setLightboxImg(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
