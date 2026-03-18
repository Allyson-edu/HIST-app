import { createClient } from '@/lib/supabase/server'
import CalendarClient from './CalendarClient'

export default async function CalendarPage() {
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
    return <CalendarClient activeSemester={null} events={[]} />
  }

  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .eq('semester_id', activeSemester.id)
    .order('event_date')

  return <CalendarClient activeSemester={activeSemester} events={events ?? []} />
}
