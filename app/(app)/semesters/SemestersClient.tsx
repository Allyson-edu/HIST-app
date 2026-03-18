'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Plus, X } from 'lucide-react'
import type { Semester } from '@/types/database'

interface SemestersClientProps {
  activeSemesters: Semester[]
  archivedSemesters: (Semester & { subjectCount: number })[]
}

export default function SemestersClient({ activeSemesters, archivedSemesters }: SemestersClientProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createSemester() {
    if (!title.trim()) { setError('Título é obrigatório.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await supabase.from('semesters').insert({
      user_id: user.id,
      title: title.trim(),
      starts_on: startsOn || null,
      ends_on: endsOn || null,
      status: 'active',
    })

    if (err) { setError(err.message); setLoading(false); return }

    setShowModal(false)
    setTitle(''); setStartsOn(''); setEndsOn('')
    setLoading(false)
    router.refresh()
  }

  async function archiveSemester(id: string) {
    if (!confirm('Encerrar este semestre? Ele será arquivado como histórico.')) return
    const supabase = createClient()
    await supabase.from('semesters').update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    }).eq('id', id)
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} style={{ color: 'var(--blue)' }} />
          <h1 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Semestres
          </h1>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Novo Semestre
        </button>
      </div>

      {/* Yellow stripe */}
      <div style={{ height: 4, background: 'var(--yellow)', marginBottom: 24 }} />

      {/* Active semesters */}
      <section className="mb-8">
        <p className="section-title mb-3">ATIVO</p>
        {activeSemesters.length === 0 ? (
          <div className="card p-4">
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhum semestre ativo. Crie um novo!</p>
          </div>
        ) : (
          activeSemesters.map((sem) => (
            <div key={sem.id} className="card-blue p-4 mb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-active">ATIVO</span>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 16 }}>{sem.title}</p>
                  {(sem.starts_on || sem.ends_on) && (
                    <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                      {sem.starts_on ? formatDate(sem.starts_on) : '?'} — {sem.ends_on ? formatDate(sem.ends_on) : '?'}
                    </p>
                  )}
                </div>
                <button
                  className="btn-red"
                  style={{ fontSize: 11, padding: '6px 12px', whiteSpace: 'nowrap' }}
                  onClick={() => archiveSemester(sem.id)}
                >
                  Encerrar
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Archived semesters */}
      {archivedSemesters.length > 0 && (
        <section>
          <p className="section-title mb-3">HISTÓRICO</p>
          {archivedSemesters.map((sem) => (
            <div key={sem.id} className="card p-4 mb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-archived">ARQUIVADO</span>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 16 }}>{sem.title}</p>
                  {(sem.starts_on || sem.ends_on) && (
                    <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                      {sem.starts_on ? formatDate(sem.starts_on) : '?'} — {sem.ends_on ? formatDate(sem.ends_on) : '?'}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                    {sem.subjectCount} disciplina{sem.subjectCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-0 w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '2px solid var(--black)' }}>
              <h2 style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Novo Semestre
              </h2>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="label">Título *</label>
                <input className="input" placeholder="ex: 2026.1" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">Início</label>
                <input className="input" type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
              </div>
              <div>
                <label className="label">Fim</label>
                <input className="input" type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={createSemester} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Semestre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}
