import { createClient } from '@/lib/supabase/server'
import { BookOpen, Target, Bell } from 'lucide-react'
import DashboardClient from './DashboardClient'
import type { Subject, SubjectMeeting, AttendanceRecord, RecurringActivity, CalendarEvent, Weekday } from '@/types/database'

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

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  const username = profile?.username ?? user.email?.split('@')[0] ?? 'aluno'

  // Get active semester
  const { data: semester } = await supabase
    .from('semesters')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const todayDate = new Date()
  const todayWeekday = weekdayMap[todayDate.getDay()]
  const todayStr = todayDate.toISOString().split('T')[0]
  const hour = todayDate.getHours()
  const greeting = getGreeting(hour)

  const todayFormatted = todayDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Get today's meetings with subject info
  interface MeetingWithSubject extends SubjectMeeting {
    subjects: Subject
  }

  let todayMeetings: MeetingWithSubject[] = []
  let todayActivities: RecurringActivity[] = []
  let upcomingEvents: CalendarEvent[] = []

  if (semester) {
    const { data: meetings } = await supabase
      .from('subject_meetings')
      .select('*, subjects(*)')
      .eq('user_id', user.id)
      .eq('day_of_week', todayWeekday)

    todayMeetings = (meetings as MeetingWithSubject[]) ?? []

    const { data: activities } = await supabase
      .from('recurring_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('semester_id', semester.id)
      .eq('day_of_week', todayWeekday)
      .order('starts_at')

    todayActivities = activities ?? []

    const in7Days = new Date(todayDate)
    in7Days.setDate(in7Days.getDate() + 7)
    const in7DaysStr = in7Days.toISOString().split('T')[0]

    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('semester_id', semester.id)
      .gte('event_date', todayStr)
      .lte('event_date', in7DaysStr)
      .order('event_date')

    upcomingEvents = events ?? []
  }

  // Get attendance records for today
  const subjectIds = todayMeetings.map((m) => m.subject_id)
  let attendanceRecords: AttendanceRecord[] = []

  if (subjectIds.length > 0) {
    const { data: records } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('class_date', todayStr)
      .in('subject_id', subjectIds)

    attendanceRecords = records ?? []
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {greeting}, {username}!
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

        {todayMeetings.length === 0 ? (
          <div className="card p-4">
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Sem aulas hoje 🎉</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {todayMeetings.map((meeting) => {
              const attendance = attendanceRecords.find((r) => r.subject_id === meeting.subject_id)
              return (
                <DashboardClient
                  key={meeting.id}
                  meeting={meeting}
                  subject={meeting.subjects}
                  attendance={attendance ?? null}
                  todayStr={todayStr}
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

        {todayActivities.length === 0 ? (
          <div className="card p-4">
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhuma atividade hoje</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayActivities.map((activity) => (
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

      {/* Block 3: Alertas e Prazos */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} style={{ color: 'var(--yellow)' }} />
          <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Alertas e Prazos
          </h2>
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>próximos 7 dias</span>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="card p-4">
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>Nenhum evento próximo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingEvents.map((event) => (
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
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{event.title}</p>
                    {event.description && (
                      <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{event.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!semester && (
          <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 12 }}>
            Crie um semestre para ver atividades e eventos.
          </p>
        )}
      </section>
    </div>
  )
}
