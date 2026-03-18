'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Subject, SubjectMeeting, AttendanceRecord } from '@/types/database'

interface Props {
  meeting: SubjectMeeting
  subject: Subject
  attendance: AttendanceRecord | null
  todayStr: string
  absencesCount?: number
}

export default function DashboardClient({ meeting, subject, attendance, todayStr, absencesCount = 0 }: Props) {
  const router = useRouter()
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord | null>(attendance)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function markAttendance(status: 'present' | 'absent') {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(
        {
          user_id: user.id,
          subject_id: subject.id,
          class_date: todayStr,
          status,
        },
        { onConflict: 'user_id,subject_id,class_date' }
      )
      .select()
      .single()

    if (!error && data) {
      setCurrentAttendance(data)
    }
    setLoading(false)
    router.refresh()
  }

  async function saveNote() {
    if (!noteContent.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('class_notes').insert({
      user_id: user.id,
      subject_id: subject.id,
      class_date: todayStr,
      content: noteContent.trim(),
    })

    setNoteContent('')
    setShowNoteForm(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p style={{ fontWeight: 700, fontSize: 14 }}>{subject.name}</p>
          <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
            {meeting.starts_at.slice(0, 5)} – {meeting.ends_at.slice(0, 5)}
            {subject.professor_name ? ` · ${subject.professor_name}` : ''}
          </p>
          {subject.absences_limit != null && (
            <div style={{ marginTop: 8 }}>
              {(() => {
                const max = subject.absences_limit as number
                const pct = max > 0 ? Math.round((absencesCount / max) * 100) : 0
                const barColor = pct >= 75 ? 'var(--red)' : pct >= 50 ? 'var(--yellow)' : 'var(--blue)'
                return (
                  <>
                    <div style={{ background: '#EBEBEB', border: '1px solid var(--border)', height: 6 }}>
                      <div style={{ background: barColor, width: `${Math.min(pct, 100)}%`, height: '100%' }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                      {absencesCount} faltas de {max} ({pct}%)
                    </p>
                  </>
                )
              })()}
            </div>
          )}
        </div>
        {currentAttendance && (
          <span className={`badge ${currentAttendance.status === 'present' ? 'badge-present' : 'badge-absent'}`}>
            {currentAttendance.status === 'present' ? '✓ Presente' : '✗ Falta'}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="btn-primary"
          style={{ background: 'var(--blue)', borderColor: 'var(--blue)', fontSize: 11, padding: '6px 12px' }}
          onClick={() => markAttendance('present')}
          disabled={loading}
        >
          ✓ Compareci
        </button>
        <button
          className="btn-red"
          style={{ fontSize: 11, padding: '6px 12px' }}
          onClick={() => markAttendance('absent')}
          disabled={loading}
        >
          ✗ Faltei
        </button>
        <button
          className="btn-secondary"
          style={{ fontSize: 11, padding: '6px 12px' }}
          onClick={() => setShowNoteForm((v) => !v)}
        >
          📝 Anotação
        </button>
      </div>

      {showNoteForm && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            className="input"
            rows={3}
            placeholder="Sua anotação sobre esta aula..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            style={{ resize: 'vertical' }}
          />
          <div className="flex gap-2">
            <button
              className="btn-primary"
              style={{ fontSize: 11, padding: '6px 12px' }}
              onClick={saveNote}
              disabled={loading || !noteContent.trim()}
            >
              Salvar
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: 11, padding: '6px 12px' }}
              onClick={() => { setShowNoteForm(false); setNoteContent('') }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
