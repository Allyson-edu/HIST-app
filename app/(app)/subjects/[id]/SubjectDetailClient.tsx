'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, ExternalLink } from 'lucide-react'
import type { Subject, SubjectMeeting, GradeEntry, ClassNote, AttendanceRecord, GradeUnit } from '@/types/database'

const weekdayPT: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
}

type Tab = 'info' | 'horarios' | 'notas' | 'diario' | 'faltas'

interface Props {
  subject: Subject
  meetings: SubjectMeeting[]
  gradeEntries: GradeEntry[]
  classNotes: ClassNote[]
  attendanceRecords: AttendanceRecord[]
}

export default function SubjectDetailClient({ subject, meetings: initialMeetings, gradeEntries: initialGrades, classNotes: initialNotes, attendanceRecords }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [meetings, setMeetings] = useState(initialMeetings)
  const [gradeEntries, setGradeEntries] = useState(initialGrades)
  const [classNotes, setClassNotes] = useState(initialNotes)

  // Info form
  const [editName, setEditName] = useState(subject.name)
  const [editProfessor, setEditProfessor] = useState(subject.professor_name ?? '')
  const [editContact, setEditContact] = useState(subject.professor_contact ?? '')
  const [editContactKind, setEditContactKind] = useState(subject.professor_contact_kind)
  const [editAbsencesLimit, setEditAbsencesLimit] = useState(subject.absences_limit?.toString() ?? '')
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  // Meetings form
  const [meetingDay, setMeetingDay] = useState('monday')
  const [meetingStart, setMeetingStart] = useState('18:30')
  const [meetingEnd, setMeetingEnd] = useState('20:10')

  // Grade form
  const [gradeUnit, setGradeUnit] = useState<GradeUnit>('u1')
  const [gradeDesc, setGradeDesc] = useState('')
  const [gradePoints, setGradePoints] = useState('')

  // Note form
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0])
  const [noteContent, setNoteContent] = useState('')
  const [showNoteForm, setShowNoteForm] = useState(false)

  async function saveInfo() {
    setInfoSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('subjects').update({
      name: editName.trim(),
      professor_name: editProfessor.trim() || null,
      professor_contact: editContact.trim() || null,
      professor_contact_kind: editContactKind,
      absences_limit: editAbsencesLimit ? parseInt(editAbsencesLimit) : null,
    }).eq('id', subject.id)
    setInfoSaving(false)
    setInfoMsg(error ? 'Erro ao salvar.' : 'Salvo!')
    setTimeout(() => setInfoMsg(''), 2000)
    router.refresh()
  }

  async function addMeeting() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('subject_meetings').insert({
      user_id: user.id, subject_id: subject.id,
      day_of_week: meetingDay, starts_at: meetingStart, ends_at: meetingEnd,
    }).select().single()
    if (data) setMeetings((prev) => [...prev, data])
  }

  async function deleteMeeting(id: string) {
    const supabase = createClient()
    await supabase.from('subject_meetings').delete().eq('id', id)
    setMeetings((prev) => prev.filter((m) => m.id !== id))
  }

  async function addGrade() {
    if (!gradeDesc.trim() || !gradePoints) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('grade_entries').insert({
      user_id: user.id, subject_id: subject.id,
      unit: gradeUnit, description: gradeDesc.trim(),
      points: parseFloat(gradePoints),
      entry_date: new Date().toISOString().split('T')[0],
    }).select().single()
    if (data) setGradeEntries((prev) => [...prev, data])
    setGradeDesc(''); setGradePoints('')
  }

  async function deleteGrade(id: string) {
    const supabase = createClient()
    await supabase.from('grade_entries').delete().eq('id', id)
    setGradeEntries((prev) => prev.filter((g) => g.id !== id))
  }

  async function addNote() {
    if (!noteContent.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('class_notes').insert({
      user_id: user.id, subject_id: subject.id,
      class_date: noteDate, content: noteContent.trim(),
    }).select().single()
    if (data) setClassNotes((prev) => [data, ...prev])
    setNoteContent(''); setShowNoteForm(false)
  }

  async function deleteNote(id: string) {
    const supabase = createClient()
    await supabase.from('class_notes').delete().eq('id', id)
    setClassNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'INFO' },
    { key: 'horarios', label: 'HORÁRIOS' },
    { key: 'notas', label: 'NOTAS' },
    { key: 'diario', label: 'DIÁRIO' },
    { key: 'faltas', label: 'FALTAS' },
  ]

  const unitTotals = (['u1', 'u2', 'u3'] as GradeUnit[]).reduce((acc, unit) => {
    acc[unit] = gradeEntries.filter((g) => g.unit === unit).reduce((s, g) => s + g.points, 0)
    return acc
  }, {} as Record<GradeUnit, number>)

  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length
  const total = attendanceRecords.length
  const presencePercent = total > 0 ? Math.round((presentCount / total) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <Link href="/subjects" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--gray)', marginBottom: 8, textDecoration: 'none' }}>
          <ArrowLeft size={12} /> Voltar
        </Link>
        <h1 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.3 }}>
          {subject.name}
        </h1>
        {subject.professor_name && (
          <div className="flex items-center gap-2 mt-1">
            <p style={{ fontSize: 13, color: 'var(--gray)' }}>{subject.professor_name}</p>
            {subject.professor_contact && (
              subject.professor_contact_kind === 'whatsapp' ? (
                <a
                  href={`https://wa.me/${subject.professor_contact.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--blue)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  WhatsApp <ExternalLink size={10} />
                </a>
              ) : (
                <a href={`mailto:${subject.professor_contact}`} style={{ color: 'var(--blue)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {subject.professor_contact} <ExternalLink size={10} />
                </a>
              )
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '2px solid var(--black)', marginBottom: 20, overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 14px',
              fontSize: 11,
              fontWeight: activeTab === tab.key ? 800 : 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid var(--red)' : '3px solid transparent',
              color: activeTab === tab.key ? 'var(--red)' : 'var(--gray)',
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
              marginBottom: -2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: INFO */}
      {activeTab === 'info' && (
        <div className="flex flex-col gap-3 max-w-md">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <label className="label">Professor</label>
            <input className="input" value={editProfessor} onChange={(e) => setEditProfessor(e.target.value)} />
          </div>
          <div>
            <label className="label">Contato</label>
            <input className="input" value={editContact} onChange={(e) => setEditContact(e.target.value)} />
          </div>
          <div>
            <label className="label">Tipo de Contato</label>
            <select className="input" value={editContactKind} onChange={(e) => setEditContactKind(e.target.value as 'whatsapp' | 'email' | 'other')}>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div>
            <label className="label">Limite de Faltas</label>
            <input className="input" type="number" min="0" value={editAbsencesLimit} onChange={(e) => setEditAbsencesLimit(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={saveInfo} disabled={infoSaving}>
              {infoSaving ? 'Salvando...' : 'Salvar'}
            </button>
            {infoMsg && <span style={{ fontSize: 13, color: 'var(--blue)' }}>{infoMsg}</span>}
          </div>
        </div>
      )}

      {/* Tab: HORÁRIOS */}
      {activeTab === 'horarios' && (
        <div>
          <div className="flex flex-col gap-2 mb-4">
            {meetings.length === 0 ? (
              <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhum horário cadastrado.</p>
            ) : (
              meetings.map((m) => (
                <div key={m.id} className="card p-3 flex items-center justify-between">
                  <span style={{ fontSize: 13 }}>
                    {weekdayPT[m.day_of_week]} · {m.starts_at.slice(0, 5)}–{m.ends_at.slice(0, 5)}
                    {m.location ? ` · ${m.location}` : ''}
                  </span>
                  <button onClick={() => deleteMeeting(m.id)} style={{ color: 'var(--red)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
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
            <button className="btn-primary" onClick={addMeeting}><Plus size={14} /> Adicionar</button>
          </div>
        </div>
      )}

      {/* Tab: NOTAS */}
      {activeTab === 'notas' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['u1', 'u2', 'u3'] as GradeUnit[]).map((unit) => {
              const entries = gradeEntries.filter((g) => g.unit === unit)
              const total = unitTotals[unit]
              const scoreColor = total >= 7 ? '#1a4dab' : total >= 5 ? '#a07000' : '#d62b2b'
              return (
                <div key={unit} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase' as const }}>{unit.toUpperCase()}</h3>
                    <span style={{ fontWeight: 900, fontSize: 18, color: scoreColor }}>{total.toFixed(1)}</span>
                  </div>
                  {entries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between mb-1" style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--gray)' }}>{e.description}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 700 }}>{e.points}</span>
                        <button onClick={() => deleteGrade(e.id)} style={{ color: 'var(--red)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Add grade form */}
          <div className="card p-4 mt-4">
            <p style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' as const, marginBottom: 8 }}>Adicionar Nota</p>
            <div className="flex gap-2 flex-wrap">
              <select className="input" style={{ flex: '0 0 80px' }} value={gradeUnit} onChange={(e) => setGradeUnit(e.target.value as GradeUnit)}>
                <option value="u1">U1</option>
                <option value="u2">U2</option>
                <option value="u3">U3</option>
              </select>
              <input className="input" style={{ flex: '1 1 150px' }} placeholder="Descrição (ex: Seminário)" value={gradeDesc} onChange={(e) => setGradeDesc(e.target.value)} />
              <input className="input" type="number" step="0.5" style={{ flex: '0 0 80px' }} placeholder="Pts" value={gradePoints} onChange={(e) => setGradePoints(e.target.value)} />
              <button className="btn-primary" onClick={addGrade} disabled={!gradeDesc || !gradePoints}>
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: DIÁRIO */}
      {activeTab === 'diario' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: 13, color: 'var(--gray)' }}>{classNotes.length} anotação{classNotes.length !== 1 ? 'ões' : ''}</p>
            <button className="btn-primary" onClick={() => setShowNoteForm(true)}>
              <Plus size={14} /> Nova Anotação
            </button>
          </div>

          {showNoteForm && (
            <div className="card p-4 mb-4">
              <div className="flex flex-col gap-2">
                <div>
                  <label className="label">Data</label>
                  <input className="input" type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
                </div>
                <div>
                  <label className="label">Conteúdo</label>
                  <textarea className="input" rows={4} placeholder="Sua anotação..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={addNote} disabled={!noteContent.trim()}>Salvar</button>
                  <button className="btn-secondary" onClick={() => { setShowNoteForm(false); setNoteContent('') }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {classNotes.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhuma anotação ainda.</p>
          ) : (
            classNotes.map((note) => (
              <div key={note.id} className="card p-4 mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', marginBottom: 4 }}>
                      {formatDate(note.class_date)}
                    </p>
                    <p style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{note.content}</p>
                  </div>
                  <button onClick={() => deleteNote(note.id)} style={{ color: 'var(--red)', flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: FALTAS */}
      {activeTab === 'faltas' && (
        <div>
          <div className="flex gap-4 mb-6">
            <div className="card-blue p-4 flex-1 text-center">
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--blue)' }}>{presentCount}</p>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: 'var(--gray)' }}>Presenças</p>
            </div>
            <div className="card-red p-4 flex-1 text-center">
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--red)' }}>{absentCount}</p>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: 'var(--gray)' }}>Faltas</p>
              {subject.absences_limit && (
                <p style={{ fontSize: 10, color: 'var(--gray)' }}>Limite: {subject.absences_limit}</p>
              )}
            </div>
            <div className="card p-4 flex-1 text-center">
              <p style={{ fontSize: 28, fontWeight: 900 }}>{presencePercent}%</p>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: 'var(--gray)' }}>Freq.</p>
            </div>
          </div>

          {attendanceRecords.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhum registro de presença ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between card p-3">
                  <span style={{ fontSize: 13 }}>{formatDate(record.class_date)}</span>
                  <span className={`badge ${record.status === 'present' ? 'badge-present' : 'badge-absent'}`}>
                    {record.status === 'present' ? '✓ Presente' : '✗ Falta'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}
