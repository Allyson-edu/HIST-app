import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  const username = profile?.username ?? user.email?.split('@')[0] ?? ''

  return (
    <div className="flex min-h-screen">
      <Sidebar username={username} />
      <main className="flex-1 md:ml-56 p-4 md:p-6 pt-14 md:pt-6">{children}</main>
    </div>
  )
}
