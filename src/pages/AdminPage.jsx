import React, { useEffect, useState } from 'react'
import {
  Users, Zap, ZapOff, Search, RefreshCw,
  Crown, Store, Calendar, ChevronDown,
  CheckCircle, XCircle, Clock, TrendingUp,
  Shield, Mail, BarChart2, Trash2, AlertTriangle,
  Sparkles, Award, FileText, Plus, Edit, Upload, Image as ImageIcon, Loader2, BookOpen
} from 'lucide-react'
import { useAuthStore } from '../lib/store.js'
import { formatDate, formatRupiah, getTierLevel, getPlanDisplayName } from '../lib/utils.js'
import { adminApi } from '../lib/api/index.js'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useDropzone } from 'react-dropzone'

const DURATIONS = [
  { label: '1 Bulan', months: 1 },
  { label: '3 Bulan', months: 3 },
  { label: '6 Bulan', months: 6 },
  { label: '1 Tahun', months: 12 },
]

const PLANS = [
  { value: 'starter', label: 'Starter', price: 29000, icon: Sparkles, color: '#3B82F6' },
  { value: 'pro', label: 'Pro', price: 49000, icon: Zap, color: '#a78bfa' },
  { value: 'business', label: 'Business', price: 79000, icon: Crown, color: '#10B981' },
]

const BLOG_CATEGORIES = ['Tips & Trik', 'Panduan', 'Kisah Sukses', 'Update Fitur']
const GUIDE_CATEGORIES = ['Setup Toko', 'Manajemen Produk', 'Pemesanan', 'Marketing', 'Analytics']
const GUIDE_LEVELS = [
  { value: 'beginner', label: 'Beginner', icon: '' },
  { value: 'intermediate', label: 'Intermediate', icon: '⚡' },
  { value: 'advanced', label: 'Advanced', icon: '🎓' },
]

export default function AdminPage() {
  const { user, token } = useAuthStore()
  const tokenObj = token

  // =============================================
  // STATE: USER MANAGEMENT (EXISTING)
  // =============================================
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState({})
  const [selectedPlan, setSelectedPlan] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  // =============================================
  // STATE: BLOG MANAGEMENT (EXISTING)
  // =============================================
  const [blogPosts, setBlogPosts] = useState([])
  const [blogLoading, setBlogLoading] = useState(false)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [blogSubmitting, setBlogSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false)
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Tips & Trik',
    author: 'Exora Team',
    featured_image: '',
    is_published: false
  })

  // =============================================
  // STATE: GUIDE MANAGEMENT (NEW)
  // =============================================
  const [guides, setGuides] = useState([])
  const [guideLoading, setGuideLoading] = useState(false)
  const [showGuideForm, setShowGuideForm] = useState(false)
  const [editingGuide, setEditingGuide] = useState(null)
  const [guideSubmitting, setGuideSubmitting] = useState(false)
  const [uploadingGuideImage, setUploadingGuideImage] = useState(false)
  const [uploadingGuideEditorImage, setUploadingGuideEditorImage] = useState(false)
  const [guideForm, setGuideForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Setup Toko',
    level: 'beginner',
    duration_minutes: 5,
    steps_count: 0,
    featured_image: '',
    is_published: false,
    order: 0
  })

  // =============================================
  // TIPTAP EDITOR SETUP (BLOG)
  // =============================================
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      ImageExtension.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' } }),
      Placeholder.configure({ placeholder: 'Tulis konten artikel di sini...\n\nGunakan toolbar untuk format teks, tambah heading, list, link, atau gambar.' }),
    ],
    content: blogForm.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setBlogForm(prev => ({ ...prev, content: html }))
    },
    editorProps: { attributes: { class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] p-4' } },
  })

  useEffect(() => {
    if (editor && blogForm.content && editor.getHTML() !== blogForm.content) {
      editor.commands.setContent(blogForm.content)
    }
  }, [editor, blogForm.content])

  // =============================================
  // TIPTAP EDITOR SETUP (GUIDE)
  // =============================================
  const guideEditor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      ImageExtension.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' } }),
      Placeholder.configure({ placeholder: 'Tulis konten panduan di sini...\n\nGunakan toolbar untuk format teks, tambah heading, list, link, atau gambar.' }),
    ],
    content: guideForm.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setGuideForm(prev => ({ ...prev, content: html }))
    },
    editorProps: { attributes: { class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] p-4' } },
  })

  useEffect(() => {
    if (guideEditor && guideForm.content && guideEditor.getHTML() !== guideForm.content) {
      guideEditor.commands.setContent(guideForm.content)
    }
  }, [guideEditor, guideForm.content])

  // =============================================
  // EFFECT: LOAD ALL DATA
  // =============================================
  useEffect(() => {
    loadAll()
    fetchBlogPosts()
    fetchGuides()
  }, [])

  // =============================================
  // FUNCTION: USER MANAGEMENT (EXISTING)
  // =============================================
  const loadAll = async () => {
    setLoading(true)
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers(tokenObj),
        adminApi.getStats(tokenObj),
      ])
      setUsers(usersRes.data || [])
      setStats(statsRes.data || null)
    } catch (err) {
      toast.error('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGrantPlan = async (targetUser) => {
    const currentPlan = targetUser.plan?.toLowerCase() || 'free'
    const targetPlan = selectedPlan[targetUser.id] || 'starter'
    const months = selectedDuration[targetUser.id] || 1

    if (currentPlan === targetPlan) {
      toast.error(`User sudah di plan ${getPlanDisplayName(targetPlan)}`)
      return
    }

    setTogglingId(targetUser.id)
    try {
      await adminApi.grantPlan(tokenObj, targetUser.id, targetPlan, months)
      const expiry = new Date()
      expiry.setMonth(expiry.getMonth() + months)
      setUsers(u => u.map(x => x.id === targetUser.id ? { ...x, plan: targetPlan, planExpiry: expiry.toISOString() } : x))
      toast.success(`${getPlanDisplayName(targetPlan)} aktif ${months} bulan untuk ${targetUser.name} `)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleRevokePlan = async (targetUser) => {
    setTogglingId(targetUser.id)
    try {
      await adminApi.revokePro(tokenObj, targetUser.id)
      setUsers(u => u.map(x => x.id === targetUser.id ? { ...x, plan: 'free', planExpiry: null } : x))
      toast.success(`Plan dinonaktifkan untuk ${targetUser.name}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    try {
      await adminApi.deleteUser(tokenObj, confirmDelete.id, confirmDelete.email)
      setUsers(u => u.filter(x => x.id !== confirmDelete.id))
      if (expandedId === confirmDelete.id) setExpandedId(null)
      toast.success(`Akun ${confirmDelete.name} berhasil dihapus`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.tokoNama?.toLowerCase().includes(search.toLowerCase())
    const matchPlan = filterPlan === 'all' || u.plan === filterPlan
    return matchSearch && matchPlan
  })

  const tierCounts = {
    free: users.filter(u => !u.plan || u.plan === 'free').length,
    starter: users.filter(u => u.plan === 'starter' && u.planExpiry && new Date(u.planExpiry) > new Date()).length,
    pro: users.filter(u => u.plan === 'pro' && u.planExpiry && new Date(u.planExpiry) > new Date()).length,
    business: users.filter(u => u.plan === 'business' && u.planExpiry && new Date(u.planExpiry) > new Date()).length,
  }

  const expiredCount = users.filter(u =>
    u.plan && u.plan !== 'free' && u.planExpiry && new Date(u.planExpiry) <= new Date()
  ).length

  const estimatedRevenue =
    (tierCounts.starter * 29000) +
    (tierCounts.pro * 49000) +
    (tierCounts.business * 79000)

  // =============================================
  // FUNCTION: BLOG MANAGEMENT (EXISTING)
  // =============================================
  const fetchBlogPosts = async () => {
    setBlogLoading(true)
    try {
      const res = await fetch('/api/blog?admin=true&token=' + tokenObj, {
        headers: { 'Authorization': 'Bearer ' + tokenObj }
      })
      const json = await res.json()
      if (json.success) {
        setBlogPosts(json.data || [])
      } else {
        throw new Error(json.error || 'Gagal memuat artikel')
      }
    } catch (err) {
      console.error('Fetch blog error:', err)
      toast.error('Gagal memuat artikel: ' + err.message)
    } finally {
      setBlogLoading(false)
    }
  }

  const resetBlogForm = () => {
    setBlogForm({
      title: '', slug: '', excerpt: '', content: '',
      category: 'Tips & Trik', author: 'Exora Team',
      featured_image: '', is_published: false
    })
    setEditingPost(null)
    if (editor) editor.commands.clearContent()
  }

  const openNewBlogForm = () => {
    resetBlogForm()
    setShowBlogForm(true)
  }

  const handleBlogSubmit = async (e) => {
    e.preventDefault()
    
    if (!blogForm.title.trim()) {
      toast.error('Judul artikel wajib diisi')
      return
    }
    
    if (!blogForm.content || blogForm.content.trim() === '<p></p>') {
      toast.error('Konten artikel wajib diisi')
      return
    }

    setBlogSubmitting(true)
    
    try {
      const method = editingPost ? 'PUT' : 'POST'
      const body = editingPost ? { ...blogForm, id: editingPost.id } : blogForm
      
      const res = await fetch('/api/blog', {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenObj },
        body: JSON.stringify({ ...body, token: tokenObj })
      })
      
      const json = await res.json()
      
      if (json.success) {
        toast.success(editingPost ? 'Artikel diupdate!' : 'Artikel dipublish!')
        setShowBlogForm(false)
        resetBlogForm()
        fetchBlogPosts()
      } else {
        throw new Error(json.error || 'Gagal menyimpan artikel')
      }
    } catch (err) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setBlogSubmitting(false)
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setBlogForm({
      title: post.title || '', slug: post.slug || '',
      excerpt: post.excerpt || '', content: post.content || '',
      category: post.category || 'Tips & Trik',
      author: post.author || 'Exora Team',
      featured_image: post.featured_image || '',
      is_published: post.is_published || false
    })
    setShowBlogForm(true)
  }

  const handleDeletePost = async (id, title) => {
    if (!confirm(`Yakin mau hapus artikel "${title}"?`)) return
    
    try {
      const res = await fetch('/api/blog', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenObj },
        body: JSON.stringify({ id, token: tokenObj })
      })
      
      const json = await res.json()
      
      if (json.success) {
        toast.success('Artikel dihapus!')
        fetchBlogPosts()
      } else {
        throw new Error(json.error || 'Gagal menghapus artikel')
      }
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message)
    }
  }

  // =============================================
  // IMAGE UPLOAD FUNCTIONS (BLOG)
  // =============================================
  const uploadImageToServer = async (file, isGuide = false) => {
    if (!file) throw new Error('File tidak valid')

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      throw new Error('Format file tidak didukung. Gunakan PNG, JPG, GIF, atau WebP')
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Ukuran file terlalu besar. Maksimal 5MB')
    }

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === 'string') {
          resolve(result.split(',')[1])
        } else {
          reject(new Error('Gagal membaca file'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const endpoint = isGuide ? '/api/guides' : '/api/blog'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenObj
      },
      body: JSON.stringify({
        token: tokenObj,
        action: 'uploadImage',
        fileBase64: base64,
        fileName: file.name || 'upload.jpg',
        contentType: file.type || 'image/jpeg'
      })
    })

    const json = await res.json()

    if (!json.success) {
      throw new Error(json.error || 'Gagal upload gambar')
    }

    return json.data.url
  }

  const handleImageUpload = async (file) => {
    setUploadingImage(true)
    try {
      const url = await uploadImageToServer(file, false)
      setBlogForm(prev => ({ ...prev, featured_image: url }))
      toast.success('Gambar berhasil diupload!')
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Upload gagal: ' + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEditorImageUpload = async (file) => {
    setUploadingEditorImage(true)
    try {
      const url = await uploadImageToServer(file, false)
      editor.chain().focus().setImage({ src: url }).run()
      toast.success('Gambar disisipkan ke konten!')
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Upload gagal: ' + err.message)
    } finally {
      setUploadingEditorImage(false)
    }
  }

  // =============================================
  // FUNCTION: GUIDE MANAGEMENT (NEW)
  // =============================================
  const fetchGuides = async () => {
    setGuideLoading(true)
    try {
      const res = await fetch('/api/guides?admin=true&token=' + tokenObj, {
        headers: { 'Authorization': 'Bearer ' + tokenObj }
      })
      const json = await res.json()
      if (json.success) {
        setGuides(json.data || [])
      } else {
        throw new Error(json.error || 'Gagal memuat panduan')
      }
    } catch (err) {
      console.error('Fetch guides error:', err)
      toast.error('Gagal memuat panduan: ' + err.message)
    } finally {
      setGuideLoading(false)
    }
  }

  const resetGuideForm = () => {
    setGuideForm({
      title: '', slug: '', excerpt: '', content: '',
      category: 'Setup Toko', level: 'beginner',
      duration_minutes: 5, steps_count: 0,
      featured_image: '', is_published: false, order: 0
    })
    setEditingGuide(null)
    if (guideEditor) guideEditor.commands.clearContent()
  }

  const openNewGuideForm = () => {
    resetGuideForm()
    setShowGuideForm(true)
  }

  const handleGuideSubmit = async (e) => {
    e.preventDefault()
    
    if (!guideForm.title.trim()) {
      toast.error('Judul panduan wajib diisi')
      return
    }
    
    if (!guideForm.content || guideForm.content.trim() === '<p></p>') {
      toast.error('Konten panduan wajib diisi')
      return
    }

    setGuideSubmitting(true)
    
    try {
      const method = editingGuide ? 'PUT' : 'POST'
      const body = editingGuide ? { ...guideForm, id: editingGuide.id } : guideForm
      
      const res = await fetch('/api/guides', {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenObj },
        body: JSON.stringify({ ...body, token: tokenObj })
      })
      
      const json = await res.json()
      
      if (json.success) {
        toast.success(editingGuide ? 'Panduan diupdate!' : 'Panduan dipublish!')
        setShowGuideForm(false)
        resetGuideForm()
        fetchGuides()
      } else {
        throw new Error(json.error || 'Gagal menyimpan panduan')
      }
    } catch (err) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setGuideSubmitting(false)
    }
  }

  const handleEditGuide = (guide) => {
    setEditingGuide(guide)
    setGuideForm({
      title: guide.title || '', slug: guide.slug || '',
      excerpt: guide.excerpt || '', content: guide.content || '',
      category: guide.category || 'Setup Toko',
      level: guide.level || 'beginner',
      duration_minutes: guide.duration_minutes || 5,
      steps_count: guide.steps_count || 0,
      featured_image: guide.featured_image || '',
      is_published: guide.is_published || false,
      order: guide.order || 0
    })
    setShowGuideForm(true)
  }

  const handleDeleteGuide = async (id, title) => {
    if (!confirm(`Yakin mau hapus panduan "${title}"?`)) return
    
    try {
      const res = await fetch('/api/guides', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenObj },
        body: JSON.stringify({ id, token: tokenObj })
      })
      
      const json = await res.json()
      
      if (json.success) {
        toast.success('Panduan dihapus!')
        fetchGuides()
      } else {
        throw new Error(json.error || 'Gagal menghapus panduan')
      }
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message)
    }
  }

  const handleGuideImageUpload = async (file) => {
    setUploadingGuideImage(true)
    try {
      const url = await uploadImageToServer(file, true)
      setGuideForm(prev => ({ ...prev, featured_image: url }))
      toast.success('Gambar berhasil diupload!')
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Upload gagal: ' + err.message)
    } finally {
      setUploadingGuideImage(false)
    }
  }

  const handleGuideEditorImageUpload = async (file) => {
    setUploadingGuideEditorImage(true)
    try {
      const url = await uploadImageToServer(file, true)
      guideEditor.chain().focus().setImage({ src: url }).run()
      toast.success('Gambar disisipkan ke konten!')
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Upload gagal: ' + err.message)
    } finally {
      setUploadingGuideEditorImage(false)
    }
  }

  // =============================================
  // DROPZONE SETUP (BLOG)
  // =============================================
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        handleImageUpload(acceptedFiles[0])
      }
    },
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  // =============================================
  // DROPZONE SETUP (GUIDE)
  // =============================================
  const { getRootProps: getGuideRootProps, getInputProps: getGuideInputProps, isDragActive: isGuideDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        handleGuideImageUpload(acceptedFiles[0])
      }
    },
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80)
  }

  // =============================================
  // RENDER
  // =============================================
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 640px) {
          .admin-navbar { padding: 0 14px !important; gap: 8px !important; }
          .admin-navbar .navbar-brand-text { display: none; }
          .admin-navbar .navbar-user-name { display: none; }
          .admin-navbar .navbar-dashboard-label { display: none; }
          .admin-content { padding: 20px 12px 60px !important; }
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .admin-revenue-card { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
          .admin-revenue-card .revenue-divider { display: none; }
          .admin-revenue-card .revenue-breakdown { gap: 8px !important; }
          .admin-search-row { flex-direction: column !important; align-items: stretch !important; }
          .admin-search-row > div:first-child { min-width: 0 !important; width: 100% !important; }
          .admin-filter-btns { display: flex !important; overflow-x: auto !important; flex-wrap: nowrap !important; padding-bottom: 2px; -webkit-overflow-scrolling: touch; }
          .admin-filter-btns::-webkit-scrollbar { display: none; }
          .seller-row-main { flex-wrap: wrap !important; }
          .seller-row-right { margin-left: auto !important; }
          .seller-expanded-actions { flex-direction: column !important; align-items: stretch !important; }
          .seller-expanded-actions > div { justify-content: flex-start !important; flex-wrap: wrap !important; }
          .seller-expanded-actions button { flex: 1 1 auto; justify-content: center !important; }
          .plan-selector-btns, .duration-selector-btns { flex-wrap: wrap !important; }
          .blog-header-row { flex-direction: column !important; align-items: stretch !important; }
          .blog-post-row { flex-direction: column !important; align-items: stretch !important; }
          .blog-post-actions { width: 100%; }
          .blog-post-actions button { flex: 1; }
          .guide-header-row { flex-direction: column !important; align-items: stretch !important; }
          .guide-post-row { flex-direction: column !important; align-items: stretch !important; }
          .guide-post-actions { width: 100%; }
          .guide-post-actions button { flex: 1; }
        }
        
        /* Tiptap Editor Styles */
        .tiptap {
          background: var(--surface);
          border: 2px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 12px;
          min-height: 300px;
        }
        .tiptap:focus {
          border-color: var(--accent);
          outline: none;
        }
        .tiptap p { margin: 0.5em 0; }
        .tiptap h1, .tiptap h2, .tiptap h3 { margin: 1em 0 0.5em 0; font-weight: 700; }
        .tiptap h1 { font-size: 2em; }
        .tiptap h2 { font-size: 1.5em; }
        .tiptap h3 { font-size: 1.25em; }
        .tiptap ul, .tiptap ol { padding-left: 1.5em; margin: 0.5em 0; }
        .tiptap img { max-width: 100%; height: auto; border-radius: var(--radius-md); margin: 1em 0; }
        .tiptap a { color: var(--accent); text-decoration: underline; }
        .editor-toolbar {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
          flex-wrap: wrap;
          padding: 8px;
          background: var(--bg-secondary);
          border: 2px solid var(--glass-border);
          border-radius: var(--radius-md);
        }
        .editor-toolbar button {
          padding: 6px 10px;
          background: var(--surface);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.15s ease;
        }
        .editor-toolbar button:hover {
          background: var(--accent-gradient);
          color: #fff;
          border-color: transparent;
        }
        .editor-toolbar button.is-active {
          background: var(--accent-gradient);
          color: #fff;
        }
        .editor-toolbar button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Fix dropdown dark mode */
        select option {
          background: var(--bg-secondary, #15151c) !important;
          color: var(--text-primary, #f5f5f7) !important;
        }
        select {
          background: var(--surface) !important;
          color: var(--text-primary) !important;
        }
      `}</style>

      {/* Top navbar */}
      <div className="admin-navbar" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0 32px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 14, color: '#fff',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}>E</div>
          <span className="navbar-brand-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Exora</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            background: 'rgba(248,113,113,0.12)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}>
            <Shield size={11} color="var(--danger)" />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--danger)', letterSpacing: '0.06em' }}>
              ADMIN PANEL
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            <Store size={14} /> <span className="navbar-dashboard-label">Dashboard Toko</span>
          </Link>
          <button onClick={loadAll} className="btn btn-ghost btn-icon btn-sm" disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.picture
              ? <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              : <div className="avatar avatar-sm">{user?.name?.[0]}</div>
            }
            <span className="navbar-user-name" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user?.name}</span>
          </div>
        </div>
      </div>

      <div className="admin-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Stats row - 4 Tier */}
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Total Seller', value: loading ? '—' : users.length, icon: Users, color: 'var(--accent)' },
            { label: 'Free', value: loading ? '—' : tierCounts.free, icon: ZapOff, color: 'var(--text-tertiary)' },
            { label: 'Starter', value: loading ? '—' : tierCounts.starter, icon: Sparkles, color: '#3B82F6' },
            { label: 'Pro', value: loading ? '—' : tierCounts.pro, icon: Zap, color: '#a78bfa' },
            { label: 'Business', value: loading ? '—' : tierCounts.business, icon: Crown, color: '#10B981' },
            { label: 'Expired', value: loading ? '—' : expiredCount, icon: Clock, color: 'var(--danger)' },
            { label: 'Total Toko', value: loading ? '—' : (stats?.totalToko ?? '—'), icon: Store, color: 'var(--success)' },
            { label: 'Total Produk', value: loading ? '—' : (stats?.totalProduk ?? '—'), icon: BarChart2, color: 'var(--accent-3)' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '16px 18px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </p>
                <s.icon size={14} color={s.color} />
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Revenue stats */}
        {stats && (
          <div className="glass-card admin-revenue-card" style={{
            padding: '18px 24px', marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(91,138,245,0.08) 0%, rgba(167,139,250,0.08) 100%)',
            border: '1px solid rgba(167,139,250,0.15)',
            display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <TrendingUp size={18} color="var(--accent)" />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Estimasi Pendapatan Platform
                </p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent)' }}>
                  {formatRupiah(estimatedRevenue)}/bulan
                </p>
              </div>
            </div>
            <div className="revenue-divider" style={{ height: 36, width: 1, background: 'var(--glass-border)' }} />
            <div className="revenue-breakdown" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {tierCounts.starter > 0 && (
                <span>
                  <strong style={{ color: '#3B82F6' }}>{tierCounts.starter}</strong> Starter × Rp 29.000
                </span>
              )}
              {tierCounts.pro > 0 && (
                <span>
                  <strong style={{ color: '#a78bfa' }}>{tierCounts.pro}</strong> Pro × Rp 49.000
                </span>
              )}
              {tierCounts.business > 0 && (
                <span>
                  <strong style={{ color: '#10B981' }}>{tierCounts.business}</strong> Business × Rp 79.000
                </span>
              )}
            </div>
          </div>
        )}

        {/* Search & filter */}
        <div className="admin-search-row" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Cari nama, email, atau nama toko..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-filter-btns" style={{ display: 'flex', gap: 10 }}>
            {[
              { value: 'all', label: 'Semua', count: users.length },
              { value: 'free', label: 'Gratis', count: tierCounts.free },
              { value: 'starter', label: '⭐ Starter', count: tierCounts.starter },
              { value: 'pro', label: '⭐ Pro', count: tierCounts.pro },
              { value: 'business', label: '👑 Business', count: tierCounts.business },
            ].map(p => (
              <button
                key={p.value}
                onClick={() => setFilterPlan(p.value)}
                className="btn btn-sm"
                style={{
                  borderRadius: 'var(--radius-full)',
                  flexShrink: 0,
                  background: filterPlan === p.value ? 'var(--surface-active)' : 'var(--surface)',
                  color: filterPlan === p.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${filterPlan === p.value ? 'var(--glass-border-hover)' : 'var(--glass-border)'}`,
                }}
              >
                {p.label}
                <span style={{
                  marginLeft: 4,
                  background: 'var(--surface-hover)',
                  padding: '1px 6px', borderRadius: 'var(--radius-full)',
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)',
                }}>
                  {p.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Users list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Tidak ada seller ditemukan</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(u => (
              <SellerRow
                key={u.id}
                seller={u}
                expanded={expandedId === u.id}
                onExpand={() => setExpandedId(expandedId === u.id ? null : u.id)}
                onGrantPlan={() => handleGrantPlan(u)}
                onRevokePlan={() => handleRevokePlan(u)}
                onDelete={() => setConfirmDelete(u)}
                isToggling={togglingId === u.id}
                isDeleting={deletingId === u.id}
                duration={selectedDuration[u.id] || 1}
                plan={selectedPlan[u.id] || 'starter'}
                onDurationChange={(months) => setSelectedDuration(d => ({ ...d, [u.id]: months }))}
                onPlanChange={(plan) => setSelectedPlan(p => ({ ...p, [u.id]: plan }))}
              />
            ))}
          </div>
        )}

        {/* ============================================= */}
        {/* BLOG MANAGEMENT SECTION (EXISTING) */}
        {/* ============================================= */}
        <div className="glass-card" style={{ 
          padding: '24px', 
          marginTop: 40, 
          borderRadius: 'var(--radius-2xl)',
        }}>
          {/* Header */}
          <div className="blog-header-row" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 24,
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(91,138,245,0.15), rgba(167,139,250,0.15))',
                border: '1px solid rgba(91,138,245,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={20} color="#5b8af5" />
              </div>
              <div>
                <h2 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontWeight: 800, 
                  fontSize: '1.2rem', 
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  Seller Hub / Blog
                </h2>
                <p style={{ 
                  fontSize: '0.82rem', 
                  color: 'var(--text-tertiary)',
                  margin: 0,
                }}>
                  {blogPosts.length} artikel {blogLoading ? '(memuat...)' : ''}
                </p>
              </div>
            </div>
            
            <button
              onClick={openNewBlogForm}
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #5b8af5, #a78bfa)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 16px rgba(91,138,245,0.35)',
                padding: '10px 18px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <Plus size={16} />
              Tulis Artikel
            </button>
          </div>

          {/* Blog Posts List */}
          {blogLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : blogPosts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px 24px', 
              color: 'var(--text-tertiary)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--glass-border)',
            }}>
              <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Belum ada artikel.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Klik "Tulis Artikel" untuk mulai.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {blogPosts.map((post) => (
                <div
                  key={post.id}
                  className="blog-post-row"
                  style={{
                    padding: '14px 18px',
                    background: 'var(--surface)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h4 style={{ 
                        fontWeight: 700, 
                        fontSize: '0.95rem', 
                        color: 'var(--text-primary)', 
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '400px',
                      }}>
                        {post.title}
                      </h4>
                      <span style={{
                        padding: '2px 8px',
                        background: post.is_published ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
                        color: post.is_published ? '#16A34A' : '#D97706',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        border: `1px solid ${post.is_published ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)'}`,
                        flexShrink: 0,
                      }}>
                        {post.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>
                      {post.category} • {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {post.view_count || 0} views
                    </p>
                  </div>
                  
                  <div className="blog-post-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleEditPost(post)}
                      className="btn btn-sm"
                      style={{
                        background: 'rgba(91,138,245,0.12)',
                        color: '#5b8af5',
                        border: '1px solid rgba(91,138,245,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Edit size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id, post.title)}
                      className="btn btn-sm"
                      style={{
                        background: 'rgba(248,113,113,0.1)',
                        color: 'var(--danger)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================= */}
        {/* GUIDE MANAGEMENT SECTION (NEW) */}
        {/* ============================================= */}
        <div className="glass-card" style={{ 
          padding: '24px', 
          marginTop: 40, 
          borderRadius: 'var(--radius-2xl)',
        }}>
          {/* Header */}
          <div className="guide-header-row" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 24,
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={20} color="#10B981" />
              </div>
              <div>
                <h2 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontWeight: 800, 
                  fontSize: '1.2rem', 
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  Panduan / Tutorial
                </h2>
                <p style={{ 
                  fontSize: '0.82rem', 
                  color: 'var(--text-tertiary)',
                  margin: 0,
                }}>
                  {guides.length} panduan {guideLoading ? '(memuat...)' : ''}
                </p>
              </div>
            </div>
            
            <button
              onClick={openNewGuideForm}
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                padding: '10px 18px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <Plus size={16} />
              Tulis Panduan
            </button>
          </div>

          {/* Guide Posts List */}
          {guideLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : guides.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px 24px', 
              color: 'var(--text-tertiary)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--glass-border)',
            }}>
              <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Belum ada panduan.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Klik "Tulis Panduan" untuk mulai.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {guides.map((guide) => (
                <div
                  key={guide.id}
                  className="guide-post-row"
                  style={{
                    padding: '14px 18px',
                    background: 'var(--surface)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h4 style={{ 
                        fontWeight: 700, 
                        fontSize: '0.95rem', 
                        color: 'var(--text-primary)', 
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '400px',
                      }}>
                        {guide.title}
                      </h4>
                      <span style={{
                        padding: '2px 8px',
                        background: guide.is_published ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
                        color: guide.is_published ? '#16A34A' : '#D97706',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        border: `1px solid ${guide.is_published ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)'}`,
                        flexShrink: 0,
                      }}>
                        {guide.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        background: 'var(--surface)',
                        color: 'var(--text-tertiary)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        border: '1px solid var(--glass-border)',
                        flexShrink: 0,
                      }}>
                        {guide.level} • {guide.duration_minutes} min
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>
                      {guide.category} • {new Date(guide.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="guide-post-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleEditGuide(guide)}
                      className="btn btn-sm"
                      style={{
                        background: 'rgba(16,185,129,0.12)',
                        color: '#10B981',
                        border: '1px solid rgba(16,185,129,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Edit size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGuide(guide.id, guide.title)}
                      className="btn btn-sm"
                      style={{
                        background: 'rgba(248,113,113,0.1)',
                        color: 'var(--danger)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ============================================= */}
      {/* BLOG FORM MODAL (EXISTING) */}
      {/* ============================================= */}
      {showBlogForm && (
        <div
          onClick={() => { setShowBlogForm(false); resetBlogForm() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 900,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-2xl)',
              padding: 28,
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'slideUp 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(91,138,245,0.15), rgba(167,139,250,0.15))',
                border: '1px solid rgba(91,138,245,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={20} color="#5b8af5" />
              </div>
              <h3 style={{ 
                fontFamily: 'var(--font-display)', 
                fontWeight: 800, 
                fontSize: '1.15rem', 
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {editingPost ? 'Edit Artikel' : 'Tulis Artikel Baru'}
              </h3>
            </div>
            
            <form onSubmit={handleBlogSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Judul */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Judul *</label>
                  <input
                    type="text" required className="form-input"
                    value={blogForm.title}
                    onChange={(e) => {
                      const newTitle = e.target.value
                      setBlogForm({ ...blogForm, title: newTitle, slug: (!blogForm.slug || blogForm.slug === generateSlug(blogForm.title)) ? generateSlug(newTitle) : blogForm.slug })
                    }}
                    placeholder="Judul artikel yang menarik..."
                  />
                </div>

                {/* Slug */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Slug (URL) *</label>
                  <input
                    type="text" required className="form-input"
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                    placeholder="contoh: cara-bikin-toko-online"
                  />
                  {blogForm.slug && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4, margin: '4px 0 0' }}>
                      URL: myexora.com/blog/<strong style={{ color: 'var(--accent)' }}>{blogForm.slug}</strong>
                    </p>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Excerpt (Ringkasan)</label>
                  <textarea
                    rows="2" className="form-input"
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                    placeholder="Ringkasan singkat artikel (muncul di list blog)..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Konten - TIPTAP EDITOR */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Konten *</label>
                  {editor && (
                    <div className="editor-toolbar">
                      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>Bold</button>
                      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>Italic</button>
                      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
                      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>H3</button>
                      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>• List</button>
                      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>1. List</button>
                      <button type="button" onClick={() => { const url = window.prompt('Masukkan URL:'); if (url) { editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run() } }} className={editor.isActive('link') ? 'is-active' : ''}>🔗 Link</button>
                      <button type="button" disabled={uploadingEditorImage} onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { if (e.target.files && e.target.files[0]) { handleEditorImageUpload(e.target.files[0]) } }; input.click() }}>{uploadingEditorImage ? '⏳ Mengupload...' : '🖼️ Gambar'}</button>
                      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>Undo</button>
                      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>↷ Redo</button>
                    </div>
                  )}
                  <EditorContent editor={editor} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Gunakan toolbar di atas untuk format teks, tambah heading, list, link, atau gambar.</p>
                </div>

                {/* Kategori & Author */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Kategori</label>
                    <select
                      className="form-input"
                      value={blogForm.category}
                      onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '2px solid var(--glass-border)' }}
                    >
                      {BLOG_CATEGORIES.map(cat => (
                        <option key={cat} value={cat} style={{ background: 'var(--bg-secondary, #15151c)', color: 'var(--text-primary, #f5f5f7)' }}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Author</label>
                    <input
                      type="text" className="form-input"
                      value={blogForm.author}
                      onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                      placeholder="Nama penulis"
                    />
                  </div>
                </div>

                {/* Featured Image - DROPZONE */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Featured Image</label>
                  {!blogForm.featured_image ? (
                    <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-lg)', padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'var(--accent-gradient-soft)' : 'var(--surface)', transition: 'all 0.2s ease' }}>
                      <input {...getInputProps()} />
                      {uploadingImage ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Mengupload gambar...</p>
                        </div>
                      ) : isDragActive ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <Upload size={32} color="var(--accent)" />
                          <p style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 700, margin: 0 }}>Lepaskan file di sini...</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>atau klik untuk pilih file</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <ImageIcon size={32} color="var(--text-tertiary)" />
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Drag & drop gambar di sini, atau klik untuk pilih file</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0 }}>PNG, JPG, GIF, WebP (max 5MB)</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--glass-border)', marginBottom: 8 }}>
                        <img src={blogForm.featured_image} alt="Featured" style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setBlogForm({ ...blogForm, featured_image: '' })} className="btn btn-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)', flex: 1 }}><Trash2 size={14} /> Hapus Gambar</button>
                        <button type="button" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { if (e.target.files && e.target.files[0]) { handleImageUpload(e.target.files[0]) } }; input.click() }} className="btn btn-sm" style={{ background: 'rgba(91,138,245,0.12)', color: '#5b8af5', border: '1px solid rgba(91,138,245,0.25)', flex: 1 }}><Upload size={14} /> Ganti Gambar</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Publish checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  <input type="checkbox" id="is_published" checked={blogForm.is_published} onChange={(e) => setBlogForm({ ...blogForm, is_published: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <label htmlFor="is_published" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Publish langsung {blogForm.is_published ? '✅' : '(simpan sebagai draft)'}</label>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => { setShowBlogForm(false); resetBlogForm() }} disabled={blogSubmitting} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
                  <button type="submit" disabled={blogSubmitting || uploadingImage} className="btn" style={{ flex: 2, background: 'linear-gradient(135deg, #5b8af5, #a78bfa)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(91,138,245,0.35)', opacity: (blogSubmitting || uploadingImage) ? 0.6 : 1, cursor: (blogSubmitting || uploadingImage) ? 'not-allowed' : 'pointer' }}>
                    {blogSubmitting ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Menyimpan...</> : editingPost ? <><CheckCircle size={14} /> Update Artikel</> : <><Plus size={14} /> Publish Artikel</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* GUIDE FORM MODAL (NEW) */}
      {/* ============================================= */}
      {showGuideForm && (
        <div
          onClick={() => { setShowGuideForm(false); resetGuideForm() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 900,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-2xl)',
              padding: 28,
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'slideUp 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={20} color="#10B981" />
              </div>
              <h3 style={{ 
                fontFamily: 'var(--font-display)', 
                fontWeight: 800, 
                fontSize: '1.15rem', 
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {editingGuide ? 'Edit Panduan' : 'Tulis Panduan Baru'}
              </h3>
            </div>
            
            <form onSubmit={handleGuideSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Judul */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Judul *</label>
                  <input
                    type="text" required className="form-input"
                    value={guideForm.title}
                    onChange={(e) => {
                      const newTitle = e.target.value
                      setGuideForm({ ...guideForm, title: newTitle, slug: (!guideForm.slug || guideForm.slug === generateSlug(guideForm.title)) ? generateSlug(newTitle) : guideForm.slug })
                    }}
                    placeholder="Judul panduan yang menarik..."
                  />
                </div>

                {/* Slug */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Slug (URL) *</label>
                  <input
                    type="text" required className="form-input"
                    value={guideForm.slug}
                    onChange={(e) => setGuideForm({ ...guideForm, slug: e.target.value })}
                    placeholder="contoh: cara-setup-toko"
                  />
                  {guideForm.slug && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4, margin: '4px 0 0' }}>
                      URL: myexora.com/guides/<strong style={{ color: 'var(--accent)' }}>{guideForm.slug}</strong>
                    </p>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Excerpt (Ringkasan)</label>
                  <textarea
                    rows="2" className="form-input"
                    value={guideForm.excerpt}
                    onChange={(e) => setGuideForm({ ...guideForm, excerpt: e.target.value })}
                    placeholder="Ringkasan singkat panduan..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Konten - TIPTAP EDITOR */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Konten *</label>
                  {guideEditor && (
                    <div className="editor-toolbar">
                      <button type="button" onClick={() => guideEditor.chain().focus().toggleBold().run()} className={guideEditor.isActive('bold') ? 'is-active' : ''}>Bold</button>
                      <button type="button" onClick={() => guideEditor.chain().focus().toggleItalic().run()} className={guideEditor.isActive('italic') ? 'is-active' : ''}>Italic</button>
                      <button type="button" onClick={() => guideEditor.chain().focus().toggleHeading({ level: 2 }).run()} className={guideEditor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
                      <button type="button" onClick={() => guideEditor.chain().focus().toggleHeading({ level: 3 }).run()} className={guideEditor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>H3</button>
                      <button type="button" onClick={() => guideEditor.chain().focus().toggleBulletList().run()} className={guideEditor.isActive('bulletList') ? 'is-active' : ''}>• List</button>
                      <button type="button" onClick={() => guideEditor.chain().focus().toggleOrderedList().run()} className={guideEditor.isActive('orderedList') ? 'is-active' : ''}>1. List</button>
                      <button type="button" onClick={() => { const url = window.prompt('Masukkan URL:'); if (url) { guideEditor.chain().focus().extendMarkRange('link').setLink({ href: url }).run() } }} className={guideEditor.isActive('link') ? 'is-active' : ''}>🔗 Link</button>
                      <button type="button" disabled={uploadingGuideEditorImage} onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { if (e.target.files && e.target.files[0]) { handleGuideEditorImageUpload(e.target.files[0]) } }; input.click() }}>{uploadingGuideEditorImage ? ' Mengupload...' : '🖼️ Gambar'}</button>
                      <button type="button" onClick={() => guideEditor.chain().focus().undo().run()} disabled={!guideEditor.can().undo()}>Undo</button>
                      <button type="button" onClick={() => guideEditor.chain().focus().redo().run()} disabled={!guideEditor.can().redo()}>↷ Redo</button>
                    </div>
                  )}
                  <EditorContent editor={guideEditor} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Gunakan toolbar di atas untuk format teks, tambah heading, list, link, atau gambar.</p>
                </div>

                {/* Kategori, Level, Duration, Steps, Order */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Kategori</label>
                    <select
                      className="form-input"
                      value={guideForm.category}
                      onChange={(e) => setGuideForm({ ...guideForm, category: e.target.value })}
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '2px solid var(--glass-border)' }}
                    >
                      {GUIDE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat} style={{ background: 'var(--bg-secondary, #15151c)', color: 'var(--text-primary, #f5f5f7)' }}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Level</label>
                    <select
                      className="form-input"
                      value={guideForm.level}
                      onChange={(e) => setGuideForm({ ...guideForm, level: e.target.value })}
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '2px solid var(--glass-border)' }}
                    >
                      {GUIDE_LEVELS.map(lvl => (
                        <option key={lvl.value} value={lvl.value} style={{ background: 'var(--bg-secondary, #15151c)', color: 'var(--text-primary, #f5f5f7)' }}>{lvl.icon} {lvl.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Durasi (menit)</label>
                    <input
                      type="number" className="form-input"
                      value={guideForm.duration_minutes}
                      onChange={(e) => setGuideForm({ ...guideForm, duration_minutes: Number(e.target.value) })}
                      min="1"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Jumlah Langkah</label>
                    <input
                      type="number" className="form-input"
                      value={guideForm.steps_count}
                      onChange={(e) => setGuideForm({ ...guideForm, steps_count: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Urutan (Order)</label>
                    <input
                      type="number" className="form-input"
                      value={guideForm.order}
                      onChange={(e) => setGuideForm({ ...guideForm, order: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                </div>

                {/* Featured Image - DROPZONE */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Featured Image</label>
                  {!guideForm.featured_image ? (
                    <div {...getGuideRootProps()} style={{ border: `2px dashed ${isGuideDragActive ? 'var(--accent)' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-lg)', padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: isGuideDragActive ? 'var(--accent-gradient-soft)' : 'var(--surface)', transition: 'all 0.2s ease' }}>
                      <input {...getGuideInputProps()} />
                      {uploadingGuideImage ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Mengupload gambar...</p>
                        </div>
                      ) : isGuideDragActive ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <Upload size={32} color="var(--accent)" />
                          <p style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 700, margin: 0 }}>Lepaskan file di sini...</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>atau klik untuk pilih file</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <ImageIcon size={32} color="var(--text-tertiary)" />
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Drag & drop gambar di sini, atau klik untuk pilih file</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0 }}>PNG, JPG, GIF, WebP (max 5MB)</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--glass-border)', marginBottom: 8 }}>
                        <img src={guideForm.featured_image} alt="Featured" style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setGuideForm({ ...guideForm, featured_image: '' })} className="btn btn-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)', flex: 1 }}><Trash2 size={14} /> Hapus Gambar</button>
                        <button type="button" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { if (e.target.files && e.target.files[0]) { handleGuideImageUpload(e.target.files[0]) } }; input.click() }} className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', flex: 1 }}><Upload size={14} /> Ganti Gambar</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Publish checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  <input type="checkbox" id="guide_is_published" checked={guideForm.is_published} onChange={(e) => setGuideForm({ ...guideForm, is_published: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <label htmlFor="guide_is_published" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Publish langsung {guideForm.is_published ? '✅' : '(simpan sebagai draft)'}</label>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => { setShowGuideForm(false); resetGuideForm() }} disabled={guideSubmitting} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
                  <button type="submit" disabled={guideSubmitting || uploadingGuideImage} className="btn" style={{ flex: 2, background: 'linear-gradient(135deg, #10B981, #3B82F6)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(16,185,129,0.35)', opacity: (guideSubmitting || uploadingGuideImage) ? 0.6 : 1, cursor: (guideSubmitting || uploadingGuideImage) ? 'not-allowed' : 'pointer' }}>
                    {guideSubmitting ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Menyimpan...</> : editingGuide ? <><CheckCircle size={14} /> Update Panduan</> : <><Plus size={14} /> Publish Panduan</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete modal (existing) */}
      {confirmDelete && (
        <ConfirmDeleteModal
          seller={confirmDelete}
          isDeleting={deletingId === confirmDelete.id}
          onConfirm={handleDeleteUser}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

// =============================================
// CONFIRM DELETE MODAL
// =============================================
function ConfirmDeleteModal({ seller, isDeleting, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 'var(--radius-2xl)',
          padding: 28,
          animation: 'slideUp 0.2s ease',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-xl)',
          background: 'rgba(248,113,113,0.12)',
          border: '1px solid rgba(248,113,113,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <AlertTriangle size={22} color="var(--danger)" />
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', marginBottom: 8 }}>
          Hapus Akun?
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 16 }}>
          Akun <strong>{seller.name}</strong> ({seller.email}) akan dihapus permanen beserta semua data toko, produk, pesanan, dan token-nya.
        </p>

        <div style={{
          padding: '10px 14px',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.15)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 24,
          fontSize: '0.8rem', color: 'var(--danger)', lineHeight: 1.5,
        }}>
          ⚠ Tindakan ini tidak bisa dibatalkan.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn"
            style={{
              flex: 1,
              background: 'rgba(248,113,113,0.15)',
              color: 'var(--danger)',
              border: '1px solid rgba(248,113,113,0.3)',
            }}
          >
            {isDeleting
              ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Menghapus...</>
              : <><Trash2 size={14} /> Hapus Permanen</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// SELLER ROW
// =============================================
function SellerRow({ seller, expanded, onExpand, onGrantPlan, onRevokePlan, onDelete, isToggling, isDeleting, duration, plan, onDurationChange, onPlanChange }) {
  const now = new Date()
  const userPlan = seller.plan?.toLowerCase() || 'free'
  const tierLevel = getTierLevel(userPlan)
  const isActive = tierLevel > 0 && seller.planExpiry && new Date(seller.planExpiry) > now
  const isExpired = tierLevel > 0 && seller.planExpiry && new Date(seller.planExpiry) <= now

  const daysLeft = isActive
    ? Math.ceil((new Date(seller.planExpiry) - now) / (1000 * 60 * 60 * 24))
    : null

  const getPlanBadge = () => {
    if (userPlan === 'business') {
      return <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 7px', background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>👑 Business</span>
    }
    if (userPlan === 'pro') {
      return <span className="badge badge-pro" style={{ fontSize: '0.65rem', padding: '1px 7px' }}>⭐ Pro</span>
    }
    if (userPlan === 'starter') {
      return <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 7px', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}>✨ Starter</span>
    }
    return null
  }

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: isActive
          ? userPlan === 'business'
            ? '1px solid rgba(16,185,129,0.25)'
            : userPlan === 'pro'
            ? '1px solid rgba(167,139,250,0.25)'
            : '1px solid rgba(59,130,246,0.25)'
          : isExpired
          ? '1px solid rgba(248,113,113,0.2)'
          : 'var(--glass-border)',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Main row */}
      <div className="seller-row-main" style={{
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer',
      }} onClick={onExpand}>

        {seller.picture
          ? <img src={seller.picture} alt={seller.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{seller.name?.[0]}</div>
        }

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{seller.name}</p>
            {getPlanBadge()}
            {isExpired && <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '1px 7px' }}>Expired</span>}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 1 }}>
            {seller.email}
            {seller.tokoNama && <span style={{ marginLeft: 8 }}>· 🏪 {seller.tokoNama}</span>}
          </p>
        </div>

        <div className="seller-row-right" style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
          {isActive && (
            <>
              <p style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700 }}>{daysLeft} hari lagi</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                s/d {formatDate(seller.planExpiry, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </>
          )}
          {isExpired && (
            <p style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 700 }}>
              Expired {formatDate(seller.planExpiry, { day: 'numeric', month: 'short' })}
            </p>
          )}
          {!isActive && !isExpired && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Gratis</p>
          )}
        </div>

        <ChevronDown
          size={15}
          color="var(--text-tertiary)"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        />
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          padding: '16px 18px 18px',
          borderTop: '1px solid var(--glass-border)',
          background: 'rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          {/* Detail info */}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <Mail size={12} color="var(--text-tertiary)" />
              {seller.email}
            </div>
            {seller.tokoSlug && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <Store size={12} color="var(--text-tertiary)" />
                <a href={`/toko/${seller.tokoSlug}`}
                  target="_blank" rel="noreferrer"
                  style={{ color: 'var(--accent)' }}
                  onClick={e => e.stopPropagation()}
                >
                  /toko/{seller.tokoSlug}
                </a>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <Calendar size={12} color="var(--text-tertiary)" />
              Daftar: {formatDate(seller.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            {seller.totalProduk !== undefined && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                📦 {seller.totalProduk} produk · 🛒 {seller.totalPesanan || 0} pesanan
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="seller-expanded-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Plan selector */}
            <div className="plan-selector-btns" style={{ display: 'flex', gap: 4 }}>
              {PLANS.map(p => (
                <button
                  key={p.value}
                  onClick={e => { e.stopPropagation(); onPlanChange(p.value) }}
                  className="btn btn-sm"
                  style={{
                    borderRadius: 'var(--radius-full)',
                    padding: '5px 10px', fontSize: '0.72rem',
                    background: plan === p.value ? `${p.color}20` : 'var(--surface)',
                    color: plan === p.value ? p.color : 'var(--text-tertiary)',
                    border: `1px solid ${plan === p.value ? `${p.color}40` : 'var(--glass-border)'}`,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Duration selector */}
            <div className="duration-selector-btns" style={{ display: 'flex', gap: 4 }}>
              {DURATIONS.map(d => (
                <button
                  key={d.months}
                  onClick={e => { e.stopPropagation(); onDurationChange(d.months) }}
                  className="btn btn-sm"
                  style={{
                    borderRadius: 'var(--radius-full)',
                    padding: '5px 10px', fontSize: '0.72rem',
                    background: duration === d.months ? 'var(--accent-gradient-soft)' : 'var(--surface)',
                    color: duration === d.months ? 'var(--accent-3)' : 'var(--text-tertiary)',
                    border: `1px solid ${duration === d.months ? 'rgba(167,139,250,0.25)' : 'var(--glass-border)'}`,
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Grant/Revoke Plan */}
            {tierLevel > 0 ? (
              <button
                onClick={e => { e.stopPropagation(); onRevokePlan() }}
                disabled={isToggling || isDeleting}
                className="btn btn-sm"
                style={{
                  background: 'rgba(248,113,113,0.12)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  minWidth: 120, gap: 7,
                }}
              >
                {isToggling
                  ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Memproses...</>
                  : <><ZapOff size={13} /> Cabut Plan</>
                }
              </button>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); onGrantPlan() }}
                disabled={isToggling || isDeleting}
                className="btn btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #5b8af5, #a78bfa)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(91,138,245,0.35)',
                  minWidth: 120, gap: 7,
                }}
              >
                {isToggling
                  ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Memproses...</>
                  : <><Zap size={13} /> Aktifkan {getPlanDisplayName(plan)} {duration > 1 ? `${duration}bln` : ''}</>
                }
              </button>
            )}

            {/* Hapus Akun */}
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              disabled={isToggling || isDeleting}
              className="btn btn-sm"
              style={{
                background: 'rgba(248,113,113,0.1)',
                color: 'var(--danger)',
                border: '1px solid rgba(248,113,113,0.2)',
                gap: 6,
              }}
            >
              {isDeleting
                ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Menghapus...</>
                : <><Trash2 size={13} /> Hapus Akun</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
