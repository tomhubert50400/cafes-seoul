import { createClient } from '@/lib/supabase/server'
import { forbidden, redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

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
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 pt-16 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
