import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

export default function RocketAnimation({ show, count = 20, duration = 2500 }) {
  const [active, setActive] = useState(false)

  // Generate rockets hanya saat show=true (biar gak re-render terus)
  const rockets = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      x: (Math.random() - 0.5) * 120, // -60vw sampai 60vw
      y: (Math.random() - 1) * 100 - 10, // -10vh sampai -110vh (ke atas)
      rotation: Math.random() * 360,
      delay: Math.random() * 0.2,
      scale: 0.8 + Math.random() * 0.8,
      emoji: Math.random() > 0.85 ? '✨' : '🚀', // 15% chance dapat sparkle
    }))
  }, [count, active])

  useEffect(() => {
    if (show) {
      setActive(true)
      const timer = setTimeout(() => setActive(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

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
          {rockets.map((rocket) => (
            <motion.div
              key={rocket.id}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: `${rocket.x}vw`,
                y: `${rocket.y}vh`,
                scale: [0, rocket.scale * 1.5, rocket.scale],
                opacity: [1, 1, 0],
                rotate: rocket.rotation,
              }}
              transition={{
                duration: duration / 1000,
                delay: rocket.delay,
                ease: [0.22, 1, 0.36, 1], // easeOut quart
              }}
              style={{
                position: 'absolute',
                top: '60%',
                left: '50%',
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                willChange: 'transform, opacity',
              }}
            >
              {rocket.emoji}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
