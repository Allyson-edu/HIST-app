'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, Plus, X, Trash2 } from 'lucide-react'
import type { RecurringActivity, Semester } from '@/types/database'

const WEEKDAYS = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

const weekdayPT: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
}

interface Props {
  activeSemester: Semester | null
  activities: RecurringActivity[]
}

interface ActivityGroup {
  name: string
  items: RecurringActivity[]
}

function groupActivitiesByName(activities: RecurringActivity[]): ActivityGroup[] {
  const map: Record<string, RecurringActivity[]> = {}
  for (const a of activities) {
    if (!map[a.name]) map[a.name] = []
    map[a.name].push(a)
  }
  return Object.entries(map).map(([name, items]) => ({ name, items }))
}

export default function ActivitiesClient({ activeSemester, activities: initialActivities }: Props) {
  const [activities, setActivities] = useState(initialActivities)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>(['monday'])
  const [startsAt, setStartsAt] = useState('13:00')
  const [endsAt, setEndsAt] = useState('15:00')
  const [location, setLocation] = useState('')

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function createActivity() {
    if (!name.trim()) { setError('Nome é obrigatório.'); return }
    if (selectedDays.length === 0) { setError('Selecione pelo menos um dia.'); return }
    if (!activeSemester) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const inserts = selectedDays.map((day) =>
      supabase.from('recurring_activities').insert({
        user_id: user.id,
        semester_id: activeSemester.id,
        name: name.trim(),
        day_of_week: day,
        starts_at: startsAt,
        ends_at: endsAt,
        location: location.trim() || null,
      }).select().single()
    )

    const results = await Promise.all(inserts)
    const failed = results.find((r) => r.error)
    if (failed?.error) { setError(failed.error.message); setLoading(false); return }

    const newActivities = results.flatMap((r) => r.data ? [r.data] : [])
    setActivities((prev) => [...prev, ...newActivities])

    setShowModal(false)
    resetForm()
    setLoading(false)
  }

  async function deleteActivity(id: string) {
    const supabase = createClient()
    await supabase.from('recurring_activities').delete().eq('id', id)
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  async function deleteAllByName(activityName: string) {
    const toDelete = activities.filter((a) => a.name === activityName)
    const supabase = createClient()
    await Promise.all(toDelete.map((a) => supabase.from('recurring_activities').delete().eq('id', a.id)))
    setActivities((prev) => prev.filter((a) => a.name !== activityName))
  }

  function resetForm() {
    setName(''); setSelectedDays(['monday']); setStartsAt('13:00'); setEndsAt('15:00'); setLocation('')
  }

  const groups = groupActivitiesByName(activities)

  return (
    <div className="page-transition">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={20} style={{ color: 'var(--red)' }} />
          <h1 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Atividades Recorrentes
          </h1>
        </div>
        {activeSemester && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nova Atividade
          </button>
        )}
      </div>

      <div style={{ height: 4, background: 'var(--yellow)', marginBottom: 24 }} />

      {!activeSemester ? (
        <div className="card p-4">
          <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhum semestre ativo.</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="card p-4">
          <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhuma atividade cadastrada.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => {
            const first = group.items[0]
            const dayLabels = group.items
              .map((a) => weekdayPT[a.day_of_week])
              .join(', ')
            return (
              <div key={group.name} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{group.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                      {dayLabels} · {first.starts_at.slice(0, 5)}–{first.ends_at.slice(0, 5)}
                      {first.location ? ` · ${first.location}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {group.items.length > 1 ? (
                      <button
                        onClick={() => deleteAllByName(group.name)}
                        style={{ color: 'var(--red)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'none', border: '1px solid var(--red)', padding: '4px 8px', cursor: 'pointer' }}
                      >
                        Excluir todos
                      </button>
                    ) : (
                      <button onClick={() => deleteActivity(group.items[0].id)} style={{ color: 'var(--red)' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {group.items.length > 1 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {group.items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, background: 'var(--light-gray)', padding: '2px 8px', border: '1px solid var(--border)' }}>
                        <span>{weekdayPT[item.day_of_week]}</span>
                        <button onClick={() => deleteActivity(item.id)} style={{ color: 'var(--red)', lineHeight: 1 }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-0 w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '2px solid var(--black)' }}>
              <h2 style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nova Atividade</h2>
              <button onClick={() => { setShowModal(false); resetForm() }}><X size={18} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="label">Nome *</label>
                <input className="input" placeholder="Ex: Extensão, Estágio..." value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Dias da Semana *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {WEEKDAYS.map((day) => (
                    <label
                      key={day.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        border: `2px solid ${selectedDays.includes(day.value) ? 'var(--black)' : 'var(--border)'}`,
                        background: selectedDays.includes(day.value) ? 'var(--black)' : '#fff',
                        color: selectedDays.includes(day.value) ? '#fff' : 'var(--black)',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day.value)}
                        onChange={() => toggleDay(day.value)}
                        style={{ display: 'none' }}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="label">Início</label>
                  <input className="input" type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="label">Fim</label>
                  <input className="input" type="time" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Local</label>
                <input className="input" placeholder="Opcional" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={createActivity} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Atividade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
