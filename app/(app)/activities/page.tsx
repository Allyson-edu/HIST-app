import { createClient } from '@/lib/supabase/server'
import ActivitiesClient from './ActivitiesClient'

export default async function ActivitiesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: activeSemester } = await supabase
    .from('semesters')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!activeSemester) {
    return <ActivitiesClient activeSemester={null} activities={[]} />
  }

  const { data: activities } = await supabase
    .from('recurring_activities')
    .select('*')
    .eq('user_id', user.id)
    .eq('semester_id', activeSemester.id)
    .order('day_of_week')
    .order('starts_at')

  return <ActivitiesClient activeSemester={activeSemester} activities={activities ?? []} />
}
