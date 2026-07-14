import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { pesananApi } from '../lib/api/index.js'
import { formatRupiah, formatDateTime, generateWALink } from '../lib/utils.js'
import { Package, Truck, MessageCircle, Printer, Download, ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
  pending: { label: 'Menunggu Konfirmasi', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  confirmed: { label: 'Dikonfirmasi', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: CheckCircle },
  processing: { label: 'Diproses', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: Package },
  shipped: { label: 'Dikirim', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', icon: Truck },
  done: { label: 'Selesai', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
}

export default function InvoicePage() {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const [pesanan, setPesanan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const isPrintMode = searchParams.get('print') === 'true'
  
  useEffect(() => {
    if (!orderId) {
      setError('Order ID tidak valid')
      setLoading(false)
      return
    }
    
    pesananApi.getByOrderId(orderId)
      .then(res => setPesanan(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orderId])
  
  useEffect(() => {
    if (isPrintMode && pesanan) {
      setTimeout(() => window.print(), 500)
    }
  }, [isPrintMode, pesanan])
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        background: '#f9fafb',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Memuat invoice...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }
  
  if (error || !pesanan) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        background: '#f9fafb',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <XCircle size={32} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>Invoice Tidak Ditemukan</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', maxWidth: 400 }}>
          {error || 'Pesanan dengan Order ID ini tidak ditemukan atau sudah tidak tersedia.'}
        </p>
        <a
          href="/"
          style={{
            marginTop: 8,
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Kembali ke Beranda
        </a>
      </div>
    )
  }
  
  const statusCfg = STATUS_CONFIG[pesanan.status] || STATUS_CONFIG.pending
  
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-content, .invoice-content * {
            visibility: visible;
          }
          .invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
      
      {/* Back Button (no-print) */}
      {!isPrintMode && (
        <div style={{
          padding: '16px 24px',
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            Kembali
          </a>
        </div>
      )}
      
      {/* Invoice Content */}
      <div className="invoice-content" style={{ maxWidth: 800, margin: '0 auto', padding: isPrintMode ? 0 : '32px 24px' }}>
        
        {/* Header */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '32px',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', margin: 0, letterSpacing: '-0.02em' }}>
                INVOICE
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 8, margin: '8px 0 0' }}>
                Order ID: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3b82f6' }}>{pesanan.orderId}</span>
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0' }}>
                Tanggal: {formatDateTime(pesanan.createdAt)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {pesanan.toko?.logo && (
                <img
                  src={pesanan.toko.logo}
                  alt={pesanan.toko.nama}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, marginBottom: 8 }}
                />
              )}
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                {pesanan.toko?.nama || 'Toko'}
              </h2>
              {pesanan.toko?.slug && (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0' }}>
                  exorashop.app/{pesanan.toko.slug}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div style={{
          background: statusCfg.bg,
          border: `2px solid ${statusCfg.color}33`,
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <statusCfg.icon size={28} color={statusCfg.color} />
          <div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status Pesanan
            </p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: statusCfg.color, margin: '4px 0 0' }}>
              {statusCfg.label}
            </p>
          </div>
        </div>
        
        {/* Buyer Info */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '24px',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Informasi Pembeli
          </h3>
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Nama</p>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', margin: '4px 0 0' }}>{pesanan.buyerNama}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>WhatsApp</p>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', margin: '4px 0 0' }}>{pesanan.buyerWa}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Alamat Pengiriman</p>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', margin: '4px 0 0', lineHeight: 1.5 }}>
                {pesanan.buyerAlamat}
              </p>
            </div>
            {pesanan.catatan && (
              <div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Catatan</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {pesanan.catatan}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Product Details */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '24px',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Detail Produk
          </h3>
          <div style={{ marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                    Produk
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                    Qty
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                    Harga
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 8px' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                      {pesanan.produkNama}
                    </p>
                  </td>
                  <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>
                      {pesanan.qty}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>
                      {formatRupiah(pesanan.harga)}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>
                      {formatRupiah(pesanan.total)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Total */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '24px',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', color: '#6b7280' }}>Subtotal</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>
                {formatRupiah(pesanan.total)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', color: '#6b7280' }}>Ongkos Kirim</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>
                Ditanggung Pembeli
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 16,
              borderTop: '2px solid #e5e7eb',
              marginTop: 8,
            }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937' }}>
                Total
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>
                {formatRupiah(pesanan.total)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Shipping Info (if shipped) */}
        {pesanan.status === 'shipped' && pesanan.kurir && pesanan.resi && (
          <div style={{
            background: 'rgba(6,182,212,0.1)',
            border: '2px solid rgba(6,182,212,0.3)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0891b2', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Informasi Pengiriman
            </h3>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Kurir</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{pesanan.kurir}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>No. Resi</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0891b2', fontFamily: 'monospace' }}>
                  {pesanan.resi}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons (no-print) */}
        {!isPrintMode && (
          <div className="no-print" style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 32,
          }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
              }}
            >
              <Printer size={16} />
              Print Invoice
            </button>
            
            {pesanan.toko?.wa && (
              <a
                href={generateWALink(pesanan.toko.wa, `Halo, saya mau tanya soal pesanan ${pesanan.orderId}`)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: '#25d366',
                  color: '#fff',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                }}
              >
                <MessageCircle size={16} />
                Chat Penjual
              </a>
            )}
            
            {pesanan.resi && (
              <a
                href={`/r/${pesanan.resi}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: '#fff',
                  color: '#1f2937',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <Truck size={16} />
                Lacak Pesanan
              </a>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '24px',
          color: '#9ca3af',
          fontSize: '0.75rem',
        }}>
          <p style={{ margin: 0 }}>
            Invoice ini digenerate otomatis oleh <strong style={{ color: '#3b82f6' }}>Exora</strong>
          </p>
          <p style={{ margin: '4px 0 0' }}>
            exorashop.app
          </p>
        </div>
        
      </div>
    </div>
  )
}
