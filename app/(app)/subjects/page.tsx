import { createClient } from '@/lib/supabase/server'
import SubjectsClient from './SubjectsClient'

export default async function SubjectsPage() {
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
    return <SubjectsClient activeSemester={null} subjects={[]} />
  }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', user.id)
    .eq('semester_id', activeSemester.id)
    .order('name')

  const subjectList = subjects ?? []

  // Get meetings and absences counts for each subject
  const subjectsWithData = await Promise.all(
    subjectList.map(async (subject) => {
      const [{ data: meetings }, { count: absencesCount }] = await Promise.all([
        supabase
          .from('subject_meetings')
          .select('*')
          .eq('subject_id', subject.id)
          .order('day_of_week'),
        supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subject.id)
          .eq('status', 'absent'),
      ])
      return { ...subject, meetings: meetings ?? [], absencesCount: absencesCount ?? 0 }
    })
  )

  return <SubjectsClient activeSemester={activeSemester} subjects={subjectsWithData} />
}
