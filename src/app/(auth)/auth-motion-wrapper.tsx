'use client'

import { motion } from 'framer-motion'

interface AuthMotionWrapperProps {
  children: React.ReactNode
}

export function AuthMotionWrapper({ children }: AuthMotionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full max-w-sm"
    >
      {children}
    </motion.div>
  )
}
