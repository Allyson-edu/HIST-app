'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Target, Plus, X, Trash2 } from 'lucide-react'
import type { RecurringActivity, Semester } from '@/types/database'

const weekdayPT: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
}

interface Props {
  activeSemester: Semester | null
  activities: RecurringActivity[]
}

export default function ActivitiesClient({ activeSemester, activities: initialActivities }: Props) {
  const router = useRouter()
  const [activities, setActivities] = useState(initialActivities)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('monday')
  const [startsAt, setStartsAt] = useState('13:00')
  const [endsAt, setEndsAt] = useState('15:00')
  const [location, setLocation] = useState('')

  async function createActivity() {
    if (!name.trim()) { setError('Nome é obrigatório.'); return }
    if (!activeSemester) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: err } = await supabase.from('recurring_activities').insert({
      user_id: user.id,
      semester_id: activeSemester.id,
      name: name.trim(),
      day_of_week: dayOfWeek,
      starts_at: startsAt,
      ends_at: endsAt,
      location: location.trim() || null,
    }).select().single()

    if (err) { setError(err.message); setLoading(false); return }
    if (data) setActivities((prev) => [...prev, data])

    setShowModal(false)
    resetForm()
    setLoading(false)
  }

  async function deleteActivity(id: string) {
    const supabase = createClient()
    await supabase.from('recurring_activities').delete().eq('id', id)
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  function resetForm() {
    setName(''); setDayOfWeek('monday'); setStartsAt('13:00'); setEndsAt('15:00'); setLocation('')
  }

  return (
    <div>
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
      ) : activities.length === 0 ? (
        <div className="card p-4">
          <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhuma atividade cadastrada.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activities.map((activity) => (
            <div key={activity.id} className="card p-4 flex items-center justify-between">
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{activity.name}</p>
                <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                  {weekdayPT[activity.day_of_week]} · {activity.starts_at.slice(0, 5)}–{activity.ends_at.slice(0, 5)}
                  {activity.location ? ` · ${activity.location}` : ''}
                </p>
              </div>
              <button onClick={() => deleteActivity(activity.id)} style={{ color: 'var(--red)' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
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
                <label className="label">Dia da Semana</label>
                <select className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                  <option value="monday">Segunda</option>
                  <option value="tuesday">Terça</option>
                  <option value="wednesday">Quarta</option>
                  <option value="thursday">Quinta</option>
                  <option value="friday">Sexta</option>
                  <option value="saturday">Sábado</option>
                  <option value="sunday">Domingo</option>
                </select>
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
