'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CalendarClient from './CalendarClient'
import type { Semester, CalendarEvent } from '@/types/database'

export default function CalendarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])

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

      const { data: eventList } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('semester_id', semester.id)
        .order('event_date')

      setEvents(eventList ?? [])
      setLoading(false)
    }
    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="page-transition flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 72 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="page-transition">
      <CalendarClient activeSemester={activeSemester} events={events} />
    </div>
  )
}
