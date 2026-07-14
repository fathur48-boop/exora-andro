import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

export default function RocketLaunch({ show, duration = 2500 }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (show) {
      setActive(true)
      const timer = setTimeout(() => setActive(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  // Generate confetti pieces
  const confetti = useMemo(() => {
    const colors = ['#ff4500', '#ff8c00', '#ffd700', '#00ff00', '#00bfff', '#ff69b4', '#9370db']
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // 0-100vw
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360,
    }))
  }, [active])

  return (
    <AnimatePresence>
      {active && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ 
                y: '-10vh', 
                x: `${piece.x}vw`, 
                opacity: 1, 
                rotate: 0,
                scale: 1
              }}
              animate={{ 
                y: '110vh', 
                opacity: [1, 1, 0],
                rotate: piece.rotation * 3,
                scale: [1, 1.2, 0.8]
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeIn'
              }}
              style={{
                position: 'absolute',
                width: piece.size,
                height: piece.size * 1.5,
                background: piece.color,
                borderRadius: '2px',
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
