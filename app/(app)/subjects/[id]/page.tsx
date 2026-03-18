import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SubjectDetailClient from './SubjectDetailClient'

interface Props {
  params: { id: string }
}

export default async function SubjectDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!subject) return notFound()

  const [
    { data: meetings },
    { data: gradeEntries },
    { data: classNotes },
    { data: attendanceRecords },
  ] = await Promise.all([
    supabase.from('subject_meetings').select('*').eq('subject_id', subject.id).order('day_of_week'),
    supabase.from('grade_entries').select('*').eq('subject_id', subject.id).order('entry_date'),
    supabase.from('class_notes').select('*').eq('subject_id', subject.id).order('class_date', { ascending: false }),
    supabase.from('attendance_records').select('*').eq('subject_id', subject.id).order('class_date', { ascending: false }),
  ])

  return (
    <SubjectDetailClient
      subject={subject}
      meetings={meetings ?? []}
      gradeEntries={gradeEntries ?? []}
      classNotes={classNotes ?? []}
      attendanceRecords={attendanceRecords ?? []}
    />
  )
}
