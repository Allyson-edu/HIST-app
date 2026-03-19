'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SubjectDetailClient from './SubjectDetailClient'
import type { Subject, SubjectMeeting, GradeEntry, ClassNote, AttendanceRecord, CalendarEvent } from '@/types/database'

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [meetings, setMeetings] = useState<SubjectMeeting[]>([])
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([])
  const [classNotes, setClassNotes] = useState<ClassNote[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [subjectEvents, setSubjectEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: subjectData } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!subjectData) { router.push('/subjects'); return }

      setSubject(subjectData)

      const [
        { data: meetingsData },
        { data: gradesData },
        { data: notesData },
        { data: attendanceData },
        { data: eventsData },
      ] = await Promise.all([
        supabase.from('subject_meetings').select('*').eq('subject_id', id).order('day_of_week'),
        supabase.from('grade_entries').select('*').eq('subject_id', id).order('entry_date'),
        supabase.from('class_notes').select('*').eq('subject_id', id).order('class_date', { ascending: false }),
        supabase.from('attendance_records').select('*').eq('subject_id', id).order('class_date', { ascending: false }),
        supabase.from('calendar_events').select('*').eq('subject_id', id).order('event_date'),
      ])

      setMeetings(meetingsData ?? [])
      setGradeEntries(gradesData ?? [])
      setClassNotes(notesData ?? [])
      setAttendanceRecords(attendanceData ?? [])
      setSubjectEvents(eventsData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [id, router])

  if (loading) {
    return (
      <div className="page-transition flex flex-col gap-3">
        <div className="skeleton" style={{ height: 40, width: 200 }} />
        <div className="skeleton" style={{ height: 36 }} />
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    )
  }

  if (!subject) return null

  return (
    <div className="page-transition">
      <SubjectDetailClient
        subject={subject}
        meetings={meetings}
        gradeEntries={gradeEntries}
        classNotes={classNotes}
        attendanceRecords={attendanceRecords}
        subjectEvents={subjectEvents}
      />
    </div>
  )
}
