'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, X, Trash2 } from 'lucide-react'
import type { CalendarEvent, Semester } from '@/types/database'

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function getMonthLabel(dateStr: string) {
  const [year, month] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function groupByMonth(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  return events.reduce((acc, event) => {
    const key = event.event_date.slice(0, 7)
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)
}

interface Props {
  activeSemester: Semester | null
  events: CalendarEvent[]
}

export default function CalendarClient({ activeSemester, events: initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')

  async function createEvent() {
    if (!title.trim()) { setError('Título é obrigatório.'); return }
    if (!activeSemester) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: err } = await supabase.from('calendar_events').insert({
      user_id: user.id,
      semester_id: activeSemester.id,
      title: title.trim(),
      event_date: eventDate,
      description: description.trim() || null,
    }).select().single()

    if (err) { setError(err.message); setLoading(false); return }
    if (data) setEvents((prev) => [...prev, data].sort((a, b) => a.event_date.localeCompare(b.event_date)))

    setShowModal(false)
    resetForm()
    setLoading(false)
  }

  async function deleteEvent(id: string) {
    const supabase = createClient()
    await supabase.from('calendar_events').delete().eq('id', id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  function resetForm() {
    setTitle(''); setEventDate(new Date().toISOString().split('T')[0]); setDescription('')
  }

  const grouped = groupByMonth(events)
  const monthKeys = Object.keys(grouped).sort()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} style={{ color: 'var(--blue)' }} />
          <h1 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Calendário
          </h1>
        </div>
        {activeSemester && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Novo Evento
          </button>
        )}
      </div>

      <div style={{ height: 4, background: 'var(--yellow)', marginBottom: 24 }} />

      {!activeSemester ? (
        <div className="card p-4">
          <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhum semestre ativo.</p>
        </div>
      ) : events.length === 0 ? (
        <div className="card p-4">
          <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhum evento cadastrado.</p>
        </div>
      ) : (
        monthKeys.map((monthKey) => (
          <section key={monthKey} className="mb-6">
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gray)', marginBottom: 12, textTransform: 'capitalize' as const }}>
              {getMonthLabel(monthKey + '-01')}
            </p>
            <div className="flex flex-col gap-3">
              {grouped[monthKey].map((event) => (
                <div key={event.id} className="card p-4 flex items-start gap-3">
                  <div
                    style={{
                      background: 'var(--yellow)',
                      border: '2px solid var(--black)',
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      minWidth: 48,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {formatDate(event.event_date).slice(0, 5)}
                  </div>
                  <div className="flex-1">
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{event.title}</p>
                    {event.description && (
                      <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{event.description}</p>
                    )}
                  </div>
                  <button onClick={() => deleteEvent(event.id)} style={{ color: 'var(--red)', flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-0 w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '2px solid var(--black)' }}>
              <h2 style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Novo Evento</h2>
              <button onClick={() => { setShowModal(false); resetForm() }}><X size={18} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="label">Título *</label>
                <input className="input" placeholder="Ex: Entrega de Trabalho" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">Data</label>
                <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea className="input" rows={3} placeholder="Detalhes opcionais..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={createEvent} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
