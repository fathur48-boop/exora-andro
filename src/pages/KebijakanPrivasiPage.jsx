import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Mail } from 'lucide-react'
import { CONFIG } from '../lib/config.js'
import { motion } from 'framer-motion'

const PJS = "'Plus Jakarta Sans', sans-serif"

export default function KebijakanPrivasiPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0b0b10', color: '#f5f5f7', fontFamily: PJS }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(11,11,16,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ color: '#a8a8b0', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Kembali
          </Link>
          <div style={{ flex: 1 }} />
          <Shield size={18} color="#10B981" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Kebijakan Privasi</span>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
              Kebijakan Privasi
            </h1>
            <p style={{ color: '#a8a8b0', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Terakhir diperbarui: 11 Juli 2026
            </p>
          </div>

          <div style={{
            padding: 20, borderRadius: 12,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            marginBottom: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Lock size={16} color="#10B981" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Komitmen Kami</span>
            </div>
            <p style={{ color: '#d1d1d6', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
              Exora berkomitmen melindungi privasi data Pengguna. Kami tidak menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga untuk tujuan komersial.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <Section number="1" title="Informasi yang Kami Kumpulkan" color="#10B981">
              <ul>
                <li><strong>Data Pribadi:</strong> Nama, alamat email, nomor WhatsApp, foto profil (dari Google OAuth).</li>
                <li><strong>Data Toko:</strong> Nama toko, slug, deskripsi, nomor WhatsApp toko, logo.</li>
                <li><strong>Data Produk:</strong> Nama produk, deskripsi, harga, stok, foto produk, kategori.</li>
                <li><strong>Data Transaksi:</strong> Riwayat pesanan, informasi pembeli (nama, alamat, nomor WA).</li>
                <li><strong>Data Teknis:</strong> IP address, jenis browser, device, cookies, dan data analytics.</li>
              </ul>
            </Section>

            <Section number="2" title="Cara Penggunaan Informasi" color="#10B981">
              <ul>
                <li>Menyediakan, mengoperasikan, dan memelihara layanan Exora.</li>
                <li>Memproses transaksi dan komunikasi antara Seller dan Pembeli.</li>
                <li>Mengirim notifikasi penting (update layanan, keamanan, pembayaran).</li>
                <li>Menganalisis penggunaan platform untuk peningkatan fitur.</li>
                <li>Mendeteksi dan mencegah penipuan atau penyalahgunaan.</li>
              </ul>
            </Section>

            <Section number="3" title="Penyimpanan Data" color="#10B981">
              <ul>
                <li>Data disimpan di Supabase (cloud infrastructure) dengan enkripsi.</li>
                <li>Foto produk dan logo disimpan di Cloudinary CDN.</li>
                <li>Server berlokasi di Indonesia dan mematuhi regulasi lokal.</li>
                <li>Data disimpan selama akun aktif, atau sesuai kewajiban hukum.</li>
              </ul>
            </Section>

            <Section number="4" title="Berbagi Informasi" color="#10B981">
              <p>Kami <strong>tidak menjual</strong> data pribadi Anda. Informasi hanya dibagikan dalam kondisi berikut:</p>
              <ul>
                <li><strong>Dengan Pembeli:</strong> Informasi toko dan produk yang diperlukan untuk transaksi.</li>
                <li><strong>Kewajiban Hukum:</strong> Jika diminta oleh otoritas hukum yang berwenang.</li>
                <li><strong>Third-Party Services:</strong> Supabase, Cloudinary, Google OAuth, WhatsApp (untuk operasional layanan).</li>
                <li><strong>Dengan Persetujuan Anda:</strong> Ketika Anda memberikan izin eksplisit.</li>
              </ul>
            </Section>

            <Section number="5" title="Keamanan Data" color="#10B981">
              <ul>
                <li>Enkripsi data saat transit (HTTPS/TLS) dan saat disimpan.</li>
                <li>Autentikasi via Google OAuth untuk keamanan akun.</li>
                <li>Regular security audit dan monitoring.</li>
                <li>Pengguna bertanggung jawab menjaga kerahasiaan password dan akun.</li>
              </ul>
            </Section>

            <Section number="6" title="Hak Pengguna" color="#10B981">
              <p>Anda memiliki hak untuk:</p>
              <ul>
                <li>Mengakses data pribadi yang kami simpan tentang Anda.</li>
                <li>Meminta koreksi data yang tidak akurat.</li>
                <li>Menghapus akun dan data pribadi Anda.</li>
                <li>Meminta export data dalam format yang dapat dibaca mesin.</li>
                <li>Menarik persetujuan pemrosesan data kapan saja.</li>
              </ul>
              <p>Untuk menggunakan hak-hak ini, hubungi kami di <a href="mailto:support@myexora.com" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>support@myexora.com</a></p>
            </Section>

            <Section number="7" title="Cookies" color="#10B981">
              <ul>
                <li><strong>Essential Cookies:</strong> Diperlukan untuk fungsi dasar platform (login, session).</li>
                <li><strong>Analytics Cookies:</strong> Untuk memahami penggunaan platform dan meningkatkan layanan.</li>
                <li>Anda dapat mengatur browser untuk menolak cookies, namun beberapa fitur mungkin tidak berfungsi.</li>
              </ul>
            </Section>

            <Section number="8" title="Perubahan Kebijakan" color="#10B981">
              <p>Kami dapat memperbarui Kebijakan Privasi ini secara berkala. Perubahan signifikan akan diumumkan melalui email atau notifikasi di platform. Penggunaan layanan setelah perubahan berarti Anda menyetujui kebijakan yang diperbarui.</p>
            </Section>

            <Section number="9" title="Kontak" color="#10B981">
              <p>Untuk pertanyaan, keluhan, atau permintaan terkait privasi data, hubungi kami:</p>
              <div style={{
                marginTop: 16, padding: 20,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 12,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={16} color="#10B981" />
                  <a href="mailto:support@myexora.com" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>support@myexora.com</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}></span>
                  <a href={`https://wa.me/${CONFIG.ADMIN_WA}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>0838-7952-7517</a>
                </div>
              </div>
            </Section>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

function Section({ number, title, children, color = '#378ADD' }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color, fontWeight: 700, fontSize: '0.875rem',
          flexShrink: 0,
        }}>
          {number}
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ color: '#d1d1d6', fontSize: '0.95rem', lineHeight: 1.7, paddingLeft: 44 }}>
        {children}
      </div>
    </div>
  )
}
