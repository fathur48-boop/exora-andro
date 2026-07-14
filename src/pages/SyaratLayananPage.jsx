import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Shield, CheckCircle } from 'lucide-react'
import { CONFIG } from '../lib/config.js'
import { motion } from 'framer-motion'

const PJS = "'Plus Jakarta Sans', sans-serif"

export default function SyaratLayananPage() {
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
          <FileText size={18} color="#378ADD" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Syarat Layanan</span>
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
              Syarat dan Ketentuan Layanan
            </h1>
            <p style={{ color: '#a8a8b0', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Terakhir diperbarui: 11 Juli 2026
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <Section number="1" title="Pendahuluan">
              <p>Selamat datang di Exora ("kami", "platform"). Dengan mengakses dan menggunakan layanan Exora, Anda ("Pengguna", "Seller") menyetujui untuk terikat oleh Syarat dan Ketentuan Layanan ini. Jika Anda tidak menyetujui, mohon untuk tidak menggunakan layanan kami.</p>
            </Section>

            <Section number="2" title="Akun dan Pendaftaran">
              <ul>
                <li>Pengguna wajib berusia minimal 18 tahun atau di bawah pengawasan orang tua/wali sah.</li>
                <li>Informasi yang diberikan saat pendaftaran harus akurat, lengkap, dan terkini.</li>
                <li>Pengguna bertanggung jawab penuh atas keamanan akun dan semua aktivitas yang terjadi di dalamnya.</li>
                <li>Dilarang membuat lebih dari 1 akun Free tanpa izin tertulis dari Exora.</li>
              </ul>
            </Section>

            <Section number="3" title="Penggunaan Layanan">
              <ul>
                <li>Layanan Exora hanya boleh digunakan untuk tujuan legal dan sesuai hukum yang berlaku di Indonesia.</li>
                <li>Dilarang menjual produk ilegal, berbahaya, atau melanggar hak kekayaan intelektual.</li>
                <li>Dilarang menyalahgunakan platform untuk spam, penipuan, atau aktivitas merugikan pihak lain.</li>
                <li>Exora berhak menangguhkan atau mengakhiri akun yang melanggar ketentuan ini.</li>
              </ul>
            </Section>

            <Section number="4" title="Plan dan Pembayaran">
              <p>Exora menyediakan beberapa paket layanan:</p>
              <ul>
                <li><strong>Free</strong> — Rp 0, selamanya, dengan fitur dasar.</li>
                <li><strong>Starter</strong> — Rp 39.000/bulan, fitur menengah.</li>
                <li><strong>Pro</strong> — Rp 59.000/bulan, fitur lengkap.</li>
                <li><strong>Business</strong> — Rp 79.000/bulan, fitur enterprise.</li>
              </ul>
              <p>Pembayaran dilakukan di muka. Tidak ada pengembalian dana (refund) untuk pembayaran yang sudah dilakukan, kecuali ditentukan lain oleh hukum yang berlaku.</p>
            </Section>

            <Section number="5" title="Konten dan Produk">
              <ul>
                <li>Seller bertanggung jawab penuh atas keakuratan, legalitas, dan kualitas produk yang dijual.</li>
                <li>Exora tidak bertanggung jawab atas sengketa antara Seller dan Pembeli.</li>
                <li>Exora berhak menghapus konten yang melanggar hukum, norma, atau ketentuan ini tanpa pemberitahuan terlebih dahulu.</li>
              </ul>
            </Section>

            <Section number="6" title="Kekayaan Intelektual">
              <p>Seluruh hak cipta, merek dagang, logo, dan aset intelektual Exora adalah milik Exora. Dilarang menyalin, memodifikasi, atau mendistribusikan tanpa izin tertulis.</p>
            </Section>

            <Section number="7" title="Batasan Tanggung Jawab">
              <ul>
                <li>Layanan disediakan "sebagaimana adanya" (as is) tanpa jaminan eksplisit maupun implisit.</li>
                <li>Exora tidak menjamin uptime 100% dan tidak bertanggung jawab atas kerugian akibat gangguan layanan.</li>
                <li>Tanggung jawab Exora dibatasi sebesar jumlah yang dibayarkan Pengguna dalam 12 bulan terakhir.</li>
              </ul>
            </Section>

            <Section number="8" title="Penghentian Layanan">
              <ul>
                <li>Pengguna dapat menghentikan layanan kapan saja dengan menghapus akun.</li>
                <li>Exora dapat menangguhkan akun yang melanggar ketentuan, dengan atau tanpa pemberitahuan.</li>
              </ul>
            </Section>

            <Section number="9" title="Perubahan Syarat">
              <p>Exora berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan diumumkan melalui website atau email. Penggunaan layanan setelah perubahan berarti Anda menyetujui perubahan tersebut.</p>
            </Section>

            <Section number="10" title="Hukum yang Berlaku">
              <p>Syarat dan Ketentuan ini tunduk pada hukum Republik Indonesia. Setiap sengketa akan diselesaikan melalui musyawarah mufakat. Jika tidak tercapai, akan diselesaikan melalui pengadilan yang berwenang di Indonesia.</p>
            </Section>

            <div style={{
              marginTop: 48, padding: '24px',
              background: 'rgba(55,138,221,0.08)',
              border: '1px solid rgba(55,138,221,0.25)',
              borderRadius: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Shield size={18} color="#378ADD" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Butuh bantuan?</span>
              </div>
              <p style={{ color: '#a8a8b0', fontSize: '0.875rem', margin: 0 }}>
                Hubungi kami di <a href={`https://wa.me/${CONFIG.ADMIN_WA}`} target="_blank" rel="noreferrer" style={{ color: '#378ADD', textDecoration: 'none', fontWeight: 600 }}>WhatsApp</a> atau email <a href="mailto:support@myexora.com" style={{ color: '#378ADD', textDecoration: 'none', fontWeight: 600 }}>support@myexora.com</a>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

function Section({ number, title, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(55,138,221,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#378ADD', fontWeight: 700, fontSize: '0.875rem',
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
