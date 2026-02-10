import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { forbidden, redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header user={user} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-4 text-2xl md:text-3xl font-bold">Admin Panel</h1>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-8 w-full justify-start flex-wrap gap-2" variant="line">
            <TabsTrigger value="dashboard" asChild className="min-h-[44px]">
              <Link href="/admin">Dashboard</Link>
            </TabsTrigger>
            <TabsTrigger value="submissions" asChild className="min-h-[44px]">
              <Link href="/admin/submissions">Submissions</Link>
            </TabsTrigger>
            <TabsTrigger value="cafes" asChild className="min-h-[44px]">
              <Link href="/admin/cafes">Cafes</Link>
            </TabsTrigger>
            <TabsTrigger value="photos" asChild className="min-h-[44px]">
              <Link href="/admin/photos">Photos</Link>
            </TabsTrigger>
            <TabsTrigger value="messages" asChild className="min-h-[44px]">
              <Link href="/admin/messages">Messages</Link>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {children}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
