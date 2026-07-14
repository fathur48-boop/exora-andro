import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, Loader, Plus, Lock, Sparkles, Zap, Crown } from 'lucide-react'
import { compressImage, getPlanDisplayName } from '../../lib/utils.js'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const CLOUDINARY_CLOUD = 'dgplz1pd0'
const CLOUDINARY_PRESET = 'tokoku'

// Updated untuk 4-tier system
const MAX_PHOTOS = {
  free: 2,
  starter: 5,
  pro: -1, // unlimited
  business: -1, // unlimited
}

const TIER_INFO = {
  free: { name: 'Gratis', next: 'starter', icon: null, color: 'var(--text-tertiary)' },
  starter: { name: 'Starter', next: 'pro', icon: Sparkles, color: '#3B82F6' },
  pro: { name: 'Pro', next: 'business', icon: Zap, color: '#a78bfa' },
  business: { name: 'Business', next: null, icon: Crown, color: '#10B981' },
}

async function uploadToCloudinary(file) {
  const compressed = await compressImage(file, 900, 0.82)
  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', CLOUDINARY_PRESET)
  formData.append('folder', 'tokoku')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error('Upload ke Cloudinary gagal')
  const data = await res.json()
  return data.secure_url
}

// value: array of URL strings
// onChange: (urls: string[]) => void
// plan: 'free' | 'starter' | 'pro' | 'business'
export default function ImageUpload({ value = [], onChange, disabled, plan = 'free' }) {
  const [uploadingIndex, setUploadingIndex] = useState(null)
  const userPlan = (plan || 'free').toLowerCase()
  const maxPhotos = MAX_PHOTOS[userPlan] ?? MAX_PHOTOS.free
  const isUnlimited = maxPhotos === -1
  const canAddMore = isUnlimited || value.length < maxPhotos
  const tierInfo = TIER_INFO[userPlan] || TIER_INFO.free

  const onDrop = useCallback(async (acceptedFiles) => {
    const remaining = isUnlimited ? acceptedFiles.length : maxPhotos - value.length
    const filesToUpload = acceptedFiles.slice(0, remaining)
    if (!filesToUpload.length) return

    setUploadingIndex('new')
    try {
      const urls = await Promise.all(filesToUpload.map(f => uploadToCloudinary(f)))
      onChange([...value, ...urls])
      toast.success(`${urls.length} foto berhasil diupload`)
    } catch (err) {
      toast.error('Gagal upload foto: ' + err.message)
    } finally {
      setUploadingIndex(null)
    }
  }, [onChange, value, maxPhotos, isUnlimited])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    disabled: disabled || uploadingIndex !== null || !canAddMore,
  })

  const handleRemove = (e, index) => {
    e.stopPropagation()
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleReplace = async (index, acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploadingIndex(index)
    try {
      const url = await uploadToCloudinary(file)
      const updated = [...value]
      updated[index] = url
      onChange(updated)
      toast.success('Foto berhasil diganti')
    } catch (err) {
      toast.error('Gagal ganti foto: ' + err.message)
    } finally {
      setUploadingIndex(null)
    }
  }

  return (
    <div>
      {/* Label + quota */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          {value.length}/{isUnlimited ? '∞' : maxPhotos} foto
        </span>
        {userPlan === 'free' && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', color: '#3B82F6',
            background: 'rgba(59,130,246,0.1)',
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <Lock size={10} />
            Maks {maxPhotos} foto · <Link to="/upgrade" style={{ color: '#3B82F6', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>Upgrade Starter</Link> untuk lebih
          </span>
        )}
        {userPlan === 'starter' && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', color: '#a78bfa',
            background: 'rgba(167,139,250,0.1)',
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(167,139,250,0.2)',
          }}>
            <Sparkles size={10} />
            Maks {maxPhotos} foto · <Link to="/upgrade" style={{ color: '#a78bfa', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>Upgrade Pro</Link> untuk unlimited
          </span>
        )}
        {(userPlan === 'pro' || userPlan === 'business') && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', color: tierInfo.color,
            background: `${tierInfo.color}20`,
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            border: `1px solid ${tierInfo.color}40`,
          }}>
            {tierInfo.icon && <tierInfo.icon size={10} />}
            Unlimited foto
          </span>
        )}
      </div>

      {/* Photo grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 10,
      }}>
        {/* Existing photos */}
        {value.map((url, index) => (
          <PhotoSlot
            key={url + index}
            url={url}
            index={index}
            isUploading={uploadingIndex === index}
            disabled={disabled}
            onRemove={(e) => handleRemove(e, index)}
            onReplace={(files) => handleReplace(index, files)}
          />
        ))}

        {/* Add more slot */}
        {canAddMore && !disabled && (
          <div
            {...getRootProps()}
            style={{
              aspectRatio: '4/3',
              border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--glass-border)'}`,
              borderRadius: 'var(--radius-lg)',
              background: isDragActive ? 'rgba(91,138,245,0.05)' : 'var(--surface)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 6, cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              opacity: uploadingIndex !== null ? 0.5 : 1,
            }}
          >
            <input {...getInputProps()} />
            {uploadingIndex === 'new' ? (
              <Loader size={20} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: isDragActive ? 'rgba(91,138,245,0.15)' : 'var(--surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isDragActive ? 'var(--accent)' : 'var(--text-tertiary)',
                }}>
                  {isDragActive ? <Upload size={18} /> : <Plus size={18} />}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  {isDragActive ? 'Lepaskan' : 'Tambah foto'}
                </p>
              </>
            )}
          </div>
        )}

        {/* Locked slot — show when free/starter user hits limit */}
        {!canAddMore && (userPlan === 'free' || userPlan === 'starter') && (
          <div style={{
            aspectRatio: '4/3',
            border: `2px dashed ${userPlan === 'free' ? 'rgba(59,130,246,0.3)' : 'rgba(167,139,250,0.3)'}`,
            borderRadius: 'var(--radius-lg)',
            background: userPlan === 'free' ? 'rgba(59,130,246,0.04)' : 'rgba(167,139,250,0.04)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 6, opacity: 0.7,
          }}>
            <Lock size={18} color={userPlan === 'free' ? '#3B82F6' : '#a78bfa'} />
            <p style={{ fontSize: '0.7rem', color: userPlan === 'free' ? '#3B82F6' : '#a78bfa', textAlign: 'center' }}>
              Upgrade {tierInfo.next === 'starter' ? 'Starter' : 'Pro'}
            </p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {value.length === 0 && canAddMore && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
          JPG, PNG, WEBP — maks 5MB per foto
        </p>
      )}
    </div>
  )
}

// Single photo slot with replace capability
function PhotoSlot({ url, index, isUploading, disabled, onRemove, onReplace }) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onReplace,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: disabled || isUploading,
    noClick: false,
  })

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/3' }}>
      <img
        src={url}
        alt={`Foto ${index + 1}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
      }} />

      {isUploading && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader size={20} color="#fff" style={{ animation: 'spin 0.7s linear infinite' }} />
        </div>
      )}

      {!disabled && !isUploading && (
        <>
          {/* Remove */}
          <button
            type="button"
            onClick={onRemove}
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-full)',
              padding: '4px', cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
          >
            <X size={12} />
          </button>

          {/* Replace */}
          <div {...getRootProps()} style={{
            position: 'absolute', bottom: 6, left: 6,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
            fontSize: '0.68rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <input {...getInputProps()} />
            <Upload size={10} />
            Ganti
          </div>

          {/* Index badge */}
          {index === 0 && (
            <div style={{
              position: 'absolute', top: 6, left: 6,
              background: 'rgba(91,138,245,0.85)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 7px',
              fontSize: '0.65rem', fontWeight: 700, color: '#fff',
            }}>
              Utama
            </div>
          )}
        </>
      )}
    </div>
  )
}
