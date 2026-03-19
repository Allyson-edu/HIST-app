'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ActivitiesClient from './ActivitiesClient'
import type { Semester, RecurringActivity } from '@/types/database'

export default function ActivitiesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null)
  const [activities, setActivities] = useState<RecurringActivity[]>([])

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

      const { data: activityList } = await supabase
        .from('recurring_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('semester_id', semester.id)
        .order('day_of_week')
        .order('starts_at')

      setActivities(activityList ?? [])
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
      <ActivitiesClient activeSemester={activeSemester} activities={activities} />
    </div>
  )
}
