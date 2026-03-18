'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Subject, SubjectMeeting, Semester } from '@/types/database'

const weekdayPT: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

interface SubjectWithMeetings extends Subject {
  meetings: SubjectMeeting[]
  absencesCount: number
}

interface Props {
  activeSemester: Semester | null
  subjects: SubjectWithMeetings[]
}

export default function SubjectsClient({ activeSemester, subjects }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Subject form
  const [name, setName] = useState('')
  const [professorName, setProfessorName] = useState('')
  const [professorContact, setProfessorContact] = useState('')
  const [professorContactKind, setProfessorContactKind] = useState<'whatsapp' | 'email' | 'other'>('whatsapp')
  const [absencesLimit, setAbsencesLimit] = useState('')

  // Meetings form
  const [meetings, setMeetings] = useState<{ day_of_week: string; starts_at: string; ends_at: string }[]>([])
  const [meetingDay, setMeetingDay] = useState('monday')
  const [meetingStart, setMeetingStart] = useState('18:30')
  const [meetingEnd, setMeetingEnd] = useState('20:10')

  function addMeeting() {
    setMeetings((prev) => [...prev, { day_of_week: meetingDay, starts_at: meetingStart, ends_at: meetingEnd }])
  }

  function removeMeeting(i: number) {
    setMeetings((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function createSubject() {
    if (!name.trim()) { setError('Nome é obrigatório.'); return }
    if (!activeSemester) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: subject, error: subErr } = await supabase
      .from('subjects')
      .insert({
        user_id: user.id,
        semester_id: activeSemester.id,
        name: name.trim(),
        professor_name: professorName.trim() || null,
        professor_contact: professorContact.trim() || null,
        professor_contact_kind: professorContactKind,
        absences_limit: absencesLimit ? parseInt(absencesLimit) : null,
      })
      .select()
      .single()

    if (subErr || !subject) { setError(subErr?.message ?? 'Erro'); setLoading(false); return }

    // Insert meetings
    if (meetings.length > 0) {
      await supabase.from('subject_meetings').insert(
        meetings.map((m) => ({
          user_id: user.id,
          subject_id: subject.id,
          day_of_week: m.day_of_week,
          starts_at: m.starts_at,
          ends_at: m.ends_at,
        }))
      )
    }

    setShowModal(false)
    resetForm()
    setLoading(false)
    router.refresh()
  }

  function resetForm() {
    setName(''); setProfessorName(''); setProfessorContact('')
    setProfessorContactKind('whatsapp'); setAbsencesLimit('')
    setMeetings([])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen size={20} style={{ color: 'var(--blue)' }} />
          <h1 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Disciplinas
          </h1>
        </div>
        {activeSemester && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nova Disciplina
          </button>
        )}
      </div>

      <div style={{ height: 4, background: 'var(--yellow)', marginBottom: 24 }} />

      {!activeSemester ? (
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 12 }}>
            Nenhum semestre ativo. Crie um semestre primeiro.
          </p>
          <Link href="/semesters" className="btn-primary" style={{ display: 'inline-flex' }}>
            Ir para Semestres
          </Link>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 16 }}>
            Semestre: <strong>{activeSemester.title}</strong>
          </p>

          {subjects.length === 0 ? (
            <div className="card p-4">
              <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhuma disciplina cadastrada. Clique em &quot;Nova Disciplina&quot;.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {subjects.map((subject) => (
        <Link key={subject.id} href={`/subjects/${subject.id}`} className="card p-4 block hover:shadow-none transition-shadow" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{subject.name}</p>
                      {subject.professor_name && (
                        <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{subject.professor_name}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {subject.meetings.length > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--blue)' }}>
                            {subject.meetings.map((m) => weekdayPT[m.day_of_week]).join(', ')}
                          </span>
                        )}
                        {subject.absencesCount > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--red)' }}>
                            {subject.absencesCount} falta{subject.absencesCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--gray)', flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-0 w-full max-w-md overflow-hidden" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '2px solid var(--black)', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <h2 style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nova Disciplina
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }}><X size={18} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="label">Nome *</label>
                <input className="input" placeholder="Ex: Fundamentos de Filosofia" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Professor</label>
                <input className="input" placeholder="Nome do professor" value={professorName} onChange={(e) => setProfessorName(e.target.value)} />
              </div>
              <div>
                <label className="label">Contato do Professor</label>
                <input className="input" placeholder="WhatsApp ou e-mail" value={professorContact} onChange={(e) => setProfessorContact(e.target.value)} />
              </div>
              <div>
                <label className="label">Tipo de Contato</label>
                <select className="input" value={professorContactKind} onChange={(e) => setProfessorContactKind(e.target.value as 'whatsapp' | 'email' | 'other')}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">E-mail</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div>
                <label className="label">Limite de Faltas</label>
                <input className="input" type="number" min="0" placeholder="Ex: 15" value={absencesLimit} onChange={(e) => setAbsencesLimit(e.target.value)} />
              </div>

              {/* Meetings */}
              <div style={{ borderTop: '2px solid var(--black)', paddingTop: 12, marginTop: 4 }}>
                <p style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Horários</p>
                <div className="flex gap-2 flex-wrap mb-2">
                  <select className="input" style={{ flex: '1 1 100px' }} value={meetingDay} onChange={(e) => setMeetingDay(e.target.value)}>
                    <option value="monday">Segunda</option>
                    <option value="tuesday">Terça</option>
                    <option value="wednesday">Quarta</option>
                    <option value="thursday">Quinta</option>
                    <option value="friday">Sexta</option>
                    <option value="saturday">Sábado</option>
                    <option value="sunday">Domingo</option>
                  </select>
                  <input className="input" type="time" style={{ flex: '1 1 80px' }} value={meetingStart} onChange={(e) => setMeetingStart(e.target.value)} />
                  <input className="input" type="time" style={{ flex: '1 1 80px' }} value={meetingEnd} onChange={(e) => setMeetingEnd(e.target.value)} />
                  <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={addMeeting}>+ Adicionar</button>
                </div>
                {meetings.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1" style={{ fontSize: 12 }}>
                    <span>{weekdayPT[m.day_of_week]} {m.starts_at}–{m.ends_at}</span>
                    <button onClick={() => removeMeeting(i)} style={{ color: 'var(--red)', fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </div>

              {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={createSubject} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Disciplina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
