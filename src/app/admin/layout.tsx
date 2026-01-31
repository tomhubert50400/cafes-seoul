import { createClient } from '@/lib/supabase/server'
import { forbidden, redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?redirect=/admin')
  }

  // Check admin role from database
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Throw 403 if not admin
  if (profile?.role !== 'admin') {
    forbidden()
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-background p-4">
        <AdminNav />
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
