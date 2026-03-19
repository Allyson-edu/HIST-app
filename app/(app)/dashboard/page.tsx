'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Target, Bell, Calendar } from 'lucide-react'
import DashboardClient from './DashboardClient'
import type { Subject, SubjectMeeting, AttendanceRecord, RecurringActivity, CalendarEvent, Weekday } from '@/types/database'

interface EventWithSubject extends CalendarEvent {
  subjects: { name: string } | null
}

const weekdayMap: Record<number, Weekday> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

const weekdayPT: Record<Weekday, string> = {
  sunday: 'Domingo',
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
}

const weekdayShort: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

interface MeetingWithSubject extends SubjectMeeting {
  subjects: Subject
}

interface DashboardData {
  username: string
  semesterId: string | null
  todayMeetings: MeetingWithSubject[]
  todayActivities: RecurringActivity[]
  upcomingEvents: EventWithSubject[]
  attendanceRecords: AttendanceRecord[]
  absencesPerSubject: Record<string, number>
  daysWithClasses: Set<Weekday>
}

function SkeletonCard({ height = 72 }: { height?: number }) {
  return <div className="skeleton" style={{ height }} />
}

function getWeekDays(): Date[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(today.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  const { todayDate, todayWeekday, todayStr, hour, todayFormatted } = useMemo(() => {
    const date = new Date()
    return {
      todayDate: date,
      todayWeekday: weekdayMap[date.getDay()],
      todayStr: date.toISOString().split('T')[0],
      hour: date.getHours(),
      todayFormatted: date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }
  }, [])

  const greeting = getGreeting(hour)

  useEffect(() => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000

    async function fetchData() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single()

      const username = profile?.username ?? user.email?.split('@')[0] ?? 'aluno'

      const { data: semester } = await supabase
        .from('semesters')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      let todayMeetings: MeetingWithSubject[] = []
      let todayActivities: RecurringActivity[] = []
      let upcomingEvents: EventWithSubject[] = []
      let allAttendanceRecords: AttendanceRecord[] = []
      let daysWithClasses = new Set<Weekday>()

      if (semester) {
        const [
          meetingsResult,
          activitiesResult,
          eventsResult,
          attendanceResult,
          allMeetingsResult,
        ] = await Promise.all([
          supabase
            .from('subject_meetings')
            .select('*, subjects!inner(*)')
            .eq('user_id', user.id)
            .eq('day_of_week', todayWeekday)
            .eq('subjects.semester_id', semester.id),
          supabase
            .from('recurring_activities')
            .select('*')
            .eq('user_id', user.id)
            .eq('semester_id', semester.id)
            .eq('day_of_week', todayWeekday)
            .order('starts_at'),
          supabase
            .from('calendar_events')
            .select('*, subjects(name)')
            .eq('user_id', user.id)
            .eq('semester_id', semester.id)
            .gte('event_date', todayStr)
            .lte('event_date', new Date(todayDate.getTime() + 7 * MS_PER_DAY).toISOString().split('T')[0])
            .order('event_date'),
          supabase
            .from('attendance_records')
            .select('*, subjects!inner(semester_id)')
            .eq('user_id', user.id)
            .eq('subjects.semester_id', semester.id),
          supabase
            .from('subject_meetings')
            .select('day_of_week, subjects!inner(semester_id)')
            .eq('user_id', user.id)
            .eq('subjects.semester_id', semester.id),
        ])

        todayMeetings = (meetingsResult.data as MeetingWithSubject[]) ?? []
        todayActivities = activitiesResult.data ?? []
        upcomingEvents = (eventsResult.data as EventWithSubject[]) ?? []
        allAttendanceRecords = (attendanceResult.data as AttendanceRecord[]) ?? []
        daysWithClasses = new Set(
          (allMeetingsResult.data ?? []).map((m: { day_of_week: Weekday }) => m.day_of_week)
        )
      }

      const absencesPerSubject: Record<string, number> = {}
      allAttendanceRecords
        .filter(r => r.status === 'absent')
        .forEach(r => {
          absencesPerSubject[r.subject_id] = (absencesPerSubject[r.subject_id] ?? 0) + 1
        })

      const subjectIds = todayMeetings.map(m => m.subject_id)
      const attendanceRecords = subjectIds.length > 0
        ? allAttendanceRecords.filter(r => r.class_date === todayStr && subjectIds.includes(r.subject_id))
        : []

      setData({
        username,
        semesterId: semester?.id ?? null,
        todayMeetings,
        todayActivities,
        upcomingEvents,
        attendanceRecords,
        absencesPerSubject,
        daysWithClasses,
      })
      setLoading(false)
    }

    fetchData()
  }, [todayStr, todayWeekday, todayDate])

  const weekDays = getWeekDays()

  return (
    <div className="page-transition">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {greeting}, {loading ? '...' : (data?.username ?? 'aluno')}!
        </h1>
        <p style={{ fontSize: 13, color: 'var(--gray)', textTransform: 'capitalize' }}>
          {todayFormatted}
        </p>
      </div>

      {/* Yellow stripe */}
      <div style={{ height: 4, background: 'var(--yellow)', marginBottom: 24 }} />

      {/* Block 1: Aulas de Hoje */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} style={{ color: 'var(--blue)' }} />
          <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Aulas de Hoje
          </h2>
          <span className="badge badge-active" style={{ fontSize: 9 }}>
            {weekdayPT[todayWeekday]}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            <SkeletonCard height={72} />
            <SkeletonCard height={72} />
          </div>
        ) : data?.todayMeetings.length === 0 ? (
          <div className="card p-4 animate-section">
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Sem aulas hoje 🎉</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-section">
            {data?.todayMeetings.map((meeting) => {
              const attendance = data.attendanceRecords.find((r) => r.subject_id === meeting.subject_id)
              const absencesCount = data.absencesPerSubject[meeting.subject_id] ?? 0
              return (
                <DashboardClient
                  key={meeting.id}
                  meeting={meeting}
                  subject={meeting.subjects}
                  attendance={attendance ?? null}
                  todayStr={todayStr}
                  absencesCount={absencesCount}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* Yellow stripe */}
      <div style={{ height: 4, background: 'var(--yellow)', marginBottom: 24 }} />

      {/* Block 2: Atividades Hoje */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} style={{ color: 'var(--red)' }} />
          <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Atividades Hoje
          </h2>
        </div>

        {loading ? (
          <SkeletonCard height={64} />
        ) : data?.todayActivities.length === 0 ? (
          <div className="card p-4 animate-section">
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhuma atividade hoje</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 animate-section">
            {data?.todayActivities.map((activity) => (
              <div key={activity.id} className="card p-4">
                <p style={{ fontWeight: 700, fontSize: 14 }}>{activity.name}</p>
                <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                  {activity.starts_at.slice(0, 5)} – {activity.ends_at.slice(0, 5)}
                  {activity.location ? ` · ${activity.location}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Yellow stripe */}
      <div style={{ height: 4, background: 'var(--yellow)', marginBottom: 24 }} />

      {/* Block 3: Semana (Mini Calendar) */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} style={{ color: 'var(--black)' }} />
          <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Semana
          </h2>
        </div>

        {loading ? (
          <SkeletonCard height={72} />
        ) : (
          <div className="card p-3 animate-section">
            <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
              {weekDays.map((day) => {
                const isToday = day.toDateString() === todayDate.toDateString()
                const dayWeekday = weekdayMap[day.getDay()]
                const hasClasses = data?.daysWithClasses.has(dayWeekday) ?? false
                return (
                  <div
                    key={day.toDateString()}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>
                      {weekdayShort[day.getDay()]}
                    </span>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: isToday ? 900 : 600,
                        background: isToday ? 'var(--black)' : 'transparent',
                        color: isToday ? '#fff' : 'var(--black)',
                        border: isToday
                          ? '2px solid var(--black)'
                          : hasClasses
                          ? '2px solid var(--blue)'
                          : '2px solid transparent',
                      }}
                    >
                      {day.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Yellow stripe */}
      <div style={{ height: 4, background: 'var(--yellow)', marginBottom: 24 }} />

      {/* Block 4: Alertas e Prazos */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} style={{ color: 'var(--yellow)' }} />
          <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Alertas e Prazos
          </h2>
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>próximos 7 dias</span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            <SkeletonCard height={64} />
            <SkeletonCard height={64} />
          </div>
        ) : data?.upcomingEvents.length === 0 ? (
          <div className="card p-4 animate-section">
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhum evento próximo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 animate-section">
            {data?.upcomingEvents.map((event) => (
              <div key={event.id} className="card p-4">
                <div className="flex items-start gap-3">
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
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{event.title}</p>
                      {event.event_type && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            padding: '2px 6px',
                            background:
                              event.event_type === 'prova' ? 'var(--red)' :
                              event.event_type === 'trabalho' ? 'var(--blue)' :
                              event.event_type === 'seminario' ? 'var(--yellow)' :
                              'var(--light-gray)',
                            color:
                              event.event_type === 'prova' ? '#fff' :
                              event.event_type === 'trabalho' ? '#fff' :
                              event.event_type === 'seminario' ? 'var(--black)' :
                              'var(--gray)',
                            border: '1px solid var(--black)',
                          }}
                        >
                          {event.event_type}
                        </span>
                      )}
                    </div>
                    {event.subjects?.name && (
                      <p style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600, marginTop: 2 }}>
                        {event.subjects.name}
                      </p>
                    )}
                    {event.description && (
                      <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{event.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !data?.semesterId && (
          <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 12 }}>
            Crie um semestre para ver atividades e eventos.
          </p>
        )}
      </section>
    </div>
  )
}
