import { createClient } from '@/lib/supabase/server'
import SemestersClient from './SemestersClient'

export default async function SemestersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: semesters } = await supabase
    .from('semesters')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allSemesters = semesters ?? []
  const activeSemesters = allSemesters.filter((s) => s.status === 'active')
  const archivedRaw = allSemesters.filter((s) => s.status === 'archived')

  // Get subject counts for archived semesters
  const archivedWithCounts = await Promise.all(
    archivedRaw.map(async (sem) => {
      const { count } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('semester_id', sem.id)
      return { ...sem, subjectCount: count ?? 0 }
    })
  )

  return (
    <SemestersClient
      activeSemesters={activeSemesters}
      archivedSemesters={archivedWithCounts}
    />
  )
}
