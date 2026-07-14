import React from 'react'
import { CONFIG } from '../../lib/config.js'
import { motion } from 'framer-motion'

export default function FloatingWA() {
  return (
    <>
      <style>{`
        .floating-wa {
          position: fixed;
          bottom: 80px;
          right: 24px;
          z-index: 999;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: #fff;
          border-radius: 100px;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(37,211,102,0.4);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .floating-wa {
            bottom: 100px !important;
            padding: 10px 14px !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      
      <motion.a
        href={`https://wa.me/${CONFIG.ADMIN_WA}?text=${encodeURIComponent('Halo Admin Exora, saya butuh bantuan.')}`}
        target="_blank"
        rel="noreferrer"
        className="floating-wa"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <img 
          src="/whatsapp.png" 
          alt="WhatsApp"
          style={{ 
            width: 24, 
            height: 24,
            objectFit: 'contain'
          }} 
        />
        <span>Butuh Bantuan?</span>
      </motion.a>
    </>
  )
}
