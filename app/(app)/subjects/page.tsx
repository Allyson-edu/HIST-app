'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SubjectsClient from './SubjectsClient'
import type { Semester, Subject, SubjectMeeting } from '@/types/database'

interface SubjectWithData extends Subject {
  meetings: SubjectMeeting[]
  absencesCount: number
}

export default function SubjectsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null)
  const [subjects, setSubjects] = useState<SubjectWithData[]>([])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: semester } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!semester) {
        setActiveSemester(null)
        setLoading(false)
        return
      }

      setActiveSemester(semester)

      const { data: subjectList } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .eq('semester_id', semester.id)
        .order('name')

      const subjectArr = subjectList ?? []

      if (subjectArr.length === 0) {
        setSubjects([])
        setLoading(false)
        return
      }

      const ids = subjectArr.map((s) => s.id)

      const [{ data: meetings }, { data: absenceRecords }] = await Promise.all([
        supabase
          .from('subject_meetings')
          .select('*')
          .in('subject_id', ids)
          .order('day_of_week'),
        supabase
          .from('attendance_records')
          .select('subject_id')
          .in('subject_id', ids)
          .eq('status', 'absent'),
      ])

      const meetingsMap: Record<string, SubjectMeeting[]> = {}
      for (const m of meetings ?? []) {
        if (!meetingsMap[m.subject_id]) meetingsMap[m.subject_id] = []
        meetingsMap[m.subject_id].push(m)
      }

      const absenceCountMap: Record<string, number> = {}
      for (const r of absenceRecords ?? []) {
        absenceCountMap[r.subject_id] = (absenceCountMap[r.subject_id] ?? 0) + 1
      }

      setSubjects(
        subjectArr.map((s) => ({
          ...s,
          meetings: meetingsMap[s.id] ?? [],
          absencesCount: absenceCountMap[s.id] ?? 0,
        }))
      )
      setLoading(false)
    }
    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="page-transition flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 88 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="page-transition">
      <SubjectsClient activeSemester={activeSemester} subjects={subjects} />
    </div>
  )
}
