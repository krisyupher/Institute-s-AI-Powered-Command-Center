/**
 * Types mirroring the backend DTOs. Kept in one place so a contract change surfaces
 * as compile errors rather than as runtime surprises scattered through components.
 */

export type RoleName = 'Student' | 'Teacher' | 'Administrator' | 'Staff';

export type CalendarEventType =
  | 'Personal'
  | 'Class'
  | 'AssignmentDue'
  | 'Exam'
  | 'Reminder';

export type RecurrenceFrequency =
  | 'None'
  | 'Daily'
  | 'Weekly'
  | 'Biweekly'
  | 'Monthly';

export type SubmissionStatus = 'NotSubmitted' | 'Submitted' | 'Late' | 'Graded';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
}

export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: User;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  term: string;
  credits: number;
  teacherName: string;
  enrolledStudents: number;
  classCount: number;
  assignmentCount: number;
}

export interface Schedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string;
}

export interface ClassSession {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  sequenceNumber: number;
  title: string;
  description: string;
  location: string;
  schedule: Schedule;
}

export interface RosterEntry {
  studentProfileId: string;
  studentNumber: string;
  fullName: string;
  email: string;
  status: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  title: string;
  description: string;
  dueAtUtc: string;
  maxPoints: number;
  mySubmissionStatus: SubmissionStatus | null;
  myPoints: number | null;
}

export interface Grade {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseCode: string;
  points: number;
  maxPoints: number;
  feedback: string;
  gradedAtUtc: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  eventType: CalendarEventType;
  startsAtUtc: string;
  endsAtUtc: string;
  frequency: RecurrenceFrequency;
  recurrenceUntilUtc: string | null;
  sourceClassSessionId: string | null;
  sourceAssignmentId: string | null;
}

export interface CalendarOccurrence {
  eventId: string;
  title: string;
  description: string;
  location: string;
  eventType: CalendarEventType;
  startsAtUtc: string;
  endsAtUtc: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAtUtc: string;
  endsAtUtc: string;
  eventType?: CalendarEventType;
  frequency?: RecurrenceFrequency;
  recurrenceUntilUtc?: string | null;
}

export interface Announcement {
  id: string;
  courseId: string | null;
  courseCode: string | null;
  authorName: string;
  title: string;
  body: string;
  publishedAtUtc: string;
  audience: 'Course' | 'Institution';
}

export interface StudentDashboard {
  fullName: string;
  enrolledCourses: number;
  upcomingAssignments: number;
  classesToday: number;
  averageGradePercent: number | null;
  nextSevenDays: CalendarOccurrence[];
  dueSoon: Assignment[];
  recentAnnouncements: Announcement[];
}

export interface TeacherDashboard {
  fullName: string;
  courses: number;
  totalStudents: number;
  pendingSubmissions: number;
  myCourses: Course[];
  nextSevenDays: CalendarOccurrence[];
  recentAnnouncements: Announcement[];
}

export interface AdminDashboard {
  fullName: string;
  totalUsers: number;
  students: number;
  teachers: number;
  courses: number;
  activeEnrollments: number;
  /** Named `Courses_` on the server to avoid clashing with the count above. */
  courses_: Course[];
  recentAnnouncements: Announcement[];
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatAction {
  tool: string;
  summary: string;
  succeeded: boolean;
}

export interface ChatResponse {
  reply: string;
  actions: ChatAction[];
  history: ChatTurn[];
}

export interface ChatStatus {
  provider: string;
  configured: boolean;
}
