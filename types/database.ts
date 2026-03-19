export type SemesterStatus = 'active' | 'archived'
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type GradeUnit = 'u1' | 'u2' | 'u3'
export type AttendanceStatus = 'present' | 'absent'
export type ContactKind = 'whatsapp' | 'email' | 'other'

export interface Profile {
  user_id: string
  username: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface Semester {
  id: string
  user_id: string
  title: string
  starts_on: string | null
  ends_on: string | null
  status: SemesterStatus
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  user_id: string
  semester_id: string
  name: string
  professor_name: string | null
  professor_contact: string | null
  professor_contact_kind: ContactKind
  absences_limit: number | null
  created_at: string
  updated_at: string
}

export interface SubjectMeeting {
  id: string
  user_id: string
  subject_id: string
  day_of_week: Weekday
  starts_at: string
  ends_at: string
  location: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  user_id: string
  subject_id: string
  class_date: string
  status: AttendanceStatus
  note: string | null
  created_at: string
  updated_at: string
}

export interface ClassNote {
  id: string
  user_id: string
  subject_id: string
  class_date: string
  content: string
  created_at: string
  updated_at: string
}

export interface GradeEntry {
  id: string
  user_id: string
  subject_id: string
  unit: GradeUnit
  description: string
  points: number
  entry_date: string
  created_at: string
  updated_at: string
}

export interface RecurringActivity {
  id: string
  user_id: string
  semester_id: string
  name: string
  day_of_week: Weekday
  starts_at: string
  ends_at: string
  location: string | null
  created_at: string
  updated_at: string
}

export type EventType = 'prova' | 'trabalho' | 'seminario' | 'outro'

export interface CalendarEvent {
  id: string
  user_id: string
  semester_id: string
  subject_id: string | null
  title: string
  event_date: string
  event_type: EventType | null
  description: string | null
  created_at: string
  updated_at: string
}
