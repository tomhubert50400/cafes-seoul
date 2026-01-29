import Link from 'next/link'
import { redirect } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/server'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ROUTES } from '@/lib/constants/routes'

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  )
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect logged-in users away from auth pages
  if (user) {
    redirect(ROUTES.HOME)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal header */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <CoffeeIcon className="h-6 w-6" />
            <span className="font-semibold">Seoul Cafés</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Centered content area with motion wrapper */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
