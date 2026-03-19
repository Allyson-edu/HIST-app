'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Semester, Subject } from '@/types/database'

interface SubjectWithAbsences extends Subject {
  absencesCount: number
}

export default function FaltasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null)
  const [subjects, setSubjects] = useState<SubjectWithAbsences[]>([])

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

      const { data: absenceRecords } = await supabase
        .from('attendance_records')
        .select('subject_id')
        .in('subject_id', ids)
        .eq('status', 'absent')

      const countMap: Record<string, number> = {}
      for (const r of absenceRecords ?? []) {
        countMap[r.subject_id] = (countMap[r.subject_id] ?? 0) + 1
      }

      setSubjects(
        subjectArr.map((s) => ({ ...s, absencesCount: countMap[s.id] ?? 0 }))
      )
      setLoading(false)
    }
    fetchData()
  }, [router])

  return (
    <div className="page-transition">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <UserX size={20} />
        <h1 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          FALTAS
        </h1>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 72 }} />
          ))}
        </div>
      ) : (
        <>
          <p className="section-title mb-3">SEMESTRE ATIVO</p>

          {!activeSemester ? (
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhum semestre ativo.</p>
          ) : subjects.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhuma disciplina cadastrada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {subjects.map((subject) => {
                const max = subject.absences_limit
                const count = subject.absencesCount

                return (
                  <div key={subject.id} className="card p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Link
                        href={`/subjects/${subject.id}`}
                        style={{ fontWeight: 700, fontSize: 14, textDecoration: 'none', color: 'var(--black)' }}
                      >
                        {subject.name}
                      </Link>
                      <span className="badge badge-absent">{count} falta{count !== 1 ? 's' : ''}</span>
                    </div>

                    {max != null && max > 0 ? (
                      (() => {
                        const pct = Math.round((count / max) * 100)
                        const barColor = pct >= 75 ? 'var(--red)' : pct >= 50 ? 'var(--yellow)' : 'var(--blue)'
                        return (
                          <>
                            <div style={{ background: '#EBEBEB', border: '1px solid var(--border)', height: 6 }}>
                              <div style={{ background: barColor, width: `${Math.min(pct, 100)}%`, height: '100%' }} />
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                              {count} faltas de {max} ({pct}%)
                            </p>
                          </>
                        )
                      })()
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
