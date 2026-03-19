'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SemestersClient from './SemestersClient'
import type { Semester } from '@/types/database'

type SemesterWithCount = Semester & { subjectCount: number }

export default function SemestersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSemesters, setActiveSemesters] = useState<Semester[]>([])
  const [archivedSemesters, setArchivedSemesters] = useState<SemesterWithCount[]>([])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: semesters } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const allSemesters = semesters ?? []
      const active = allSemesters.filter((s) => s.status === 'active')
      const archivedRaw = allSemesters.filter((s) => s.status === 'archived')

      setActiveSemesters(active)

      if (archivedRaw.length === 0) {
        setArchivedSemesters([])
        setLoading(false)
        return
      }

      const archivedIds = archivedRaw.map((s) => s.id)

      const { data: subjectRows } = await supabase
        .from('subjects')
        .select('semester_id')
        .in('semester_id', archivedIds)

      const countMap: Record<string, number> = {}
      for (const row of subjectRows ?? []) {
        countMap[row.semester_id] = (countMap[row.semester_id] ?? 0) + 1
      }

      setArchivedSemesters(
        archivedRaw.map((sem) => ({ ...sem, subjectCount: countMap[sem.id] ?? 0 }))
      )
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
      <SemestersClient
        activeSemesters={activeSemesters}
        archivedSemesters={archivedSemesters}
      />
    </div>
  )
}
