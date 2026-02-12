'use client'

interface AuthMotionWrapperProps {
  children: React.ReactNode
}

export function AuthMotionWrapper({ children }: AuthMotionWrapperProps) {
  return (
    <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
      {children}
    </div>
  )
}
