// src/lib/utils.js

// Import dari config.js (single source of truth)
import { CONFIG, PLAN_FEATURES, TIER_ORDER, getTierLevel, getPlanDisplayName } from './config.js'

// Re-export agar komponen lain tetap bisa import dari utils.js
export { CONFIG, PLAN_FEATURES, TIER_ORDER, getTierLevel, getPlanDisplayName }
export { 
  hasAccessToFeature, 
  getProductLimit, 
  checkProductLimit, 
  getNextPlan, 
  getPlanBadgeColor, 
  isPro, 
  isStarter, 
  isBusiness 
} from './config.js'

// --- FORMAT & UTILITAS DASAR ---

export function formatRupiah(amount) {
  if (amount === null || amount === undefined || amount === '') return '-'
  const num = Number(amount)
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  }).format(new Date(dateStr))
}

export function formatDateShort(dateStr) {
  return formatDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isValidSlug(slug) {
  return /^[a-z0-9][a-z0-9-]{2,29}$/.test(slug)
}

export function truncate(text, length = 100) {
  if (text === null || text === undefined || text === '') return ''
  const str = String(text)
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(name) {
  if (!name) return '?'
  return String(name)
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// --- WHATSAPP UTILS ---

export function validateWA(wa) {
  if (wa === null || wa === undefined || wa === '') return null
  const clean = String(wa).replace(/\D/g, '')
  if (clean.length < 8) return null
  if (clean.startsWith('0')) return '62' + clean.slice(1)
  if (clean.startsWith('62')) return clean
  if (clean.startsWith('8')) return '62' + clean
  return null
}

export function formatWADisplay(wa) {
  if (!wa) return '-'
  const clean = String(wa).replace(/\D/g, '')
  const num = clean.startsWith('62') ? clean : '62' + clean
  return '+' + num.slice(0, 2) + ' ' + num.slice(2, 5) + '-' + num.slice(5, 9) + '-' + num.slice(9)
}

export function generateWALink(wa, message = '') {
  const clean = validateWA(wa)
  if (!clean) return '#'
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${clean}${message ? '?text=' + encoded : ''}`
}

export function generateCheckoutMessage(produk, toko, buyer) {
  return `Halo ${toko.nama}, saya mau pesan:\n\n*${produk.nama}*\nHarga: ${formatRupiah(produk.harga)}\nQty: ${buyer.qty || 1}\n\nNama: ${buyer.nama}\nAlamat: ${buyer.alamat}\n${buyer.catatan ? 'Catatan: ' + buyer.catatan + '\n' : ''}\nTotal: ${formatRupiah(produk.harga * (buyer.qty || 1))}\n\nMohon konfirmasi ketersediaan ya!`
}

// UPDATED: Support parameter targetPlan
export function generateUpgradeMessage(user, toko, targetPlan = 'pro') {
  const targetName = getPlanDisplayName(targetPlan)
  return `Halo Admin Exora, saya ingin upgrade ke paket ${targetName}:\n\nNama: ${user?.name || '-'}\nEmail: ${user?.email || '-'}\nToko: ${toko?.nama || '-'}\nSlug: ${toko?.slug || '-'}\n\nMohon info cara pembayarannya ya!`
}

export function generateShareTokoWA(toko) {
  const url = getStorefrontUrl(toko.slug)
  const msg = `Cek toko online saya di Exora\n\n*${toko.nama}*\n${toko.deskripsi ? toko.deskripsi + '\n' : ''}\n${url}`
  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}

export function generateShareProdukWA(produk, toko) {
  const url = `${getStorefrontUrl(toko.slug)}?produk=${produk.id}`
  const msg = `Cek produk ini di toko ${toko.nama}\n\n*${produk.nama}*\n${formatRupiah(produk.harga)}\n\n${url}`
  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}

// --- IMAGE UTILS ---

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          quality
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// --- STATUS & CONFIG ---

export const PESANAN_STATUS = {
  pending: { label: 'Menunggu', color: 'warning' },
  confirmed: { label: 'Dikonfirmasi', color: 'success' },
  processing: { label: 'Diproses', color: 'accent' },
  shipped: { label: 'Dikirim', color: 'accent' },
  done: { label: 'Selesai', color: 'success' },
  cancelled: { label: 'Dibatalkan', color: 'danger' },
}

// --- LAINNYA ---

export function getStorefrontUrl(slug) {
  const baseUrl = CONFIG?.APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${baseUrl}/${slug}`
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  }
}
