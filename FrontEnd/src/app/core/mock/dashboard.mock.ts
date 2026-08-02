/**
 * Mock dashboard payloads, shaped exactly like the DTOs the API will return.
 *
 * Dates are generated relative to today so the "next seven days" panels always have
 * something in them. Times are built in UTC because the app renders schedules in UTC
 * (see the timezone note in the root README).
 */

import {
  AdminDashboard,
  Announcement,
  Assignment,
  CalendarOccurrence,
  Course,
  StudentDashboard,
  TeacherDashboard,
} from '../models/api.models';

const DAY_MS = 86_400_000;

const now = new Date();
const midnightTodayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

/** ISO instant `dayOffset` days from today at the given UTC wall-clock time. */
function at(dayOffset: number, hour: number, minute = 0): string {
  return new Date(
    midnightTodayUtc + dayOffset * DAY_MS + hour * 3_600_000 + minute * 60_000,
  ).toISOString();
}

const courses: Course[] = [
  {
    id: 'c1',
    code: 'CS-201',
    name: 'Data Structures',
    description: 'Lists, trees, graphs and the cost of choosing badly.',
    term: 'Fall 2026',
    credits: 4,
    teacherName: 'Elena Rivera',
    enrolledStudents: 28,
    classCount: 24,
    assignmentCount: 6,
  },
  {
    id: 'c2',
    code: 'PHY-110',
    name: 'Classical Mechanics',
    description: 'Newtonian motion, energy and momentum.',
    term: 'Fall 2026',
    credits: 3,
    teacherName: 'Elena Rivera',
    enrolledStudents: 34,
    classCount: 20,
    assignmentCount: 5,
  },
  {
    id: 'c3',
    code: 'MAT-150',
    name: 'Linear Algebra',
    description: 'Vector spaces, matrices and transformations.',
    term: 'Fall 2026',
    credits: 4,
    teacherName: 'Tomas Klein',
    enrolledStudents: 41,
    classCount: 22,
    assignmentCount: 7,
  },
  {
    id: 'c4',
    code: 'HIS-101',
    name: 'Modern History',
    description: 'The long nineteenth century and its aftermath.',
    term: 'Fall 2026',
    credits: 3,
    teacherName: 'Marta Oyelaran',
    enrolledStudents: 19,
    classCount: 18,
    assignmentCount: 4,
  },
];

const studentOccurrences: CalendarOccurrence[] = [
  {
    eventId: 'o1',
    title: 'CS-201 · Class #4 — Balanced trees',
    description: 'AVL rotations and amortised cost.',
    location: 'Hall B-204',
    eventType: 'Class',
    startsAtUtc: at(0, 8, 0),
    endsAtUtc: at(0, 9, 30),
  },
  {
    eventId: 'o2',
    title: 'MAT-150 · Class #7 — Eigenvectors',
    description: '',
    location: 'Hall A-101',
    eventType: 'Class',
    startsAtUtc: at(0, 11, 0),
    endsAtUtc: at(0, 12, 30),
  },
  {
    eventId: 'o3',
    title: 'Reminder: start Physics problem set',
    description: 'Two days before the deadline.',
    location: '',
    eventType: 'Reminder',
    startsAtUtc: at(1, 18, 0),
    endsAtUtc: at(1, 18, 30),
  },
  {
    eventId: 'o4',
    title: 'PHY-110 · Class #5 — Conservation laws',
    description: '',
    location: 'Lab 2',
    eventType: 'Class',
    startsAtUtc: at(2, 10, 0),
    endsAtUtc: at(2, 11, 30),
  },
  {
    eventId: 'o5',
    title: 'Data Structures — midterm',
    description: 'Covers everything through week 6.',
    location: 'Hall B-204',
    eventType: 'Exam',
    startsAtUtc: at(4, 9, 0),
    endsAtUtc: at(4, 11, 0),
  },
  {
    eventId: 'o6',
    title: 'Linear Algebra assignment due',
    description: '',
    location: '',
    eventType: 'AssignmentDue',
    startsAtUtc: at(6, 23, 0),
    endsAtUtc: at(6, 23, 59),
  },
];

const teacherOccurrences: CalendarOccurrence[] = [
  {
    eventId: 't1',
    title: 'CS-201 · Class #4 — Balanced trees',
    description: '',
    location: 'Hall B-204',
    eventType: 'Class',
    startsAtUtc: at(0, 8, 0),
    endsAtUtc: at(0, 9, 30),
  },
  {
    eventId: 't2',
    title: 'PHY-110 · Class #5 — Conservation laws',
    description: '',
    location: 'Lab 2',
    eventType: 'Class',
    startsAtUtc: at(2, 10, 0),
    endsAtUtc: at(2, 11, 30),
  },
  {
    eventId: 't3',
    title: 'Faculty meeting',
    description: 'Term planning.',
    location: 'Room 12',
    eventType: 'Personal',
    startsAtUtc: at(3, 15, 0),
    endsAtUtc: at(3, 16, 0),
  },
  {
    eventId: 't4',
    title: 'Data Structures — midterm invigilation',
    description: '',
    location: 'Hall B-204',
    eventType: 'Exam',
    startsAtUtc: at(4, 9, 0),
    endsAtUtc: at(4, 11, 0),
  },
];

const dueSoon: Assignment[] = [
  {
    id: 'a1',
    courseId: 'c2',
    courseCode: 'PHY-110',
    courseName: 'Classical Mechanics',
    title: 'Problem set 3 — momentum',
    description: 'Questions 1–8 from chapter 4.',
    dueAtUtc: at(3, 23, 59),
    maxPoints: 100,
    mySubmissionStatus: 'NotSubmitted',
    myPoints: null,
  },
  {
    id: 'a2',
    courseId: 'c3',
    courseCode: 'MAT-150',
    courseName: 'Linear Algebra',
    title: 'Eigenvector worksheet',
    description: '',
    dueAtUtc: at(6, 23, 59),
    maxPoints: 50,
    mySubmissionStatus: 'NotSubmitted',
    myPoints: null,
  },
  {
    id: 'a3',
    courseId: 'c1',
    courseCode: 'CS-201',
    courseName: 'Data Structures',
    title: 'Graph traversal lab report',
    description: '',
    dueAtUtc: at(9, 23, 59),
    maxPoints: 100,
    mySubmissionStatus: 'Submitted',
    myPoints: null,
  },
];

const announcements: Announcement[] = [
  {
    id: 'n1',
    courseId: 'c1',
    courseCode: 'CS-201',
    authorName: 'Elena Rivera',
    title: 'Midterm room changed',
    body: 'The midterm moves to Hall B-204. Bring your student card.',
    publishedAtUtc: at(-1, 9, 15),
    audience: 'Course',
  },
  {
    id: 'n2',
    courseId: null,
    courseCode: null,
    authorName: 'Registrar',
    title: 'Library hours extended',
    body: 'The library stays open until 22:00 for the rest of the term.',
    publishedAtUtc: at(-2, 14, 0),
    audience: 'Institution',
  },
  {
    id: 'n3',
    courseId: 'c2',
    courseCode: 'PHY-110',
    authorName: 'Elena Rivera',
    title: 'Lab groups posted',
    body: 'Check the course page for your assigned bench.',
    publishedAtUtc: at(-4, 11, 30),
    audience: 'Course',
  },
];

export const MOCK_STUDENT_DASHBOARD: StudentDashboard = {
  fullName: 'Ana Morales',
  enrolledCourses: 3,
  classesToday: 2,
  upcomingAssignments: 3,
  averageGradePercent: 87,
  nextSevenDays: studentOccurrences,
  dueSoon,
  recentAnnouncements: announcements,
};

export const MOCK_TEACHER_DASHBOARD: TeacherDashboard = {
  fullName: 'Elena Rivera',
  courses: 2,
  totalStudents: 62,
  pendingSubmissions: 14,
  myCourses: [courses[0], courses[1]],
  nextSevenDays: teacherOccurrences,
  recentAnnouncements: announcements.filter((a) => a.authorName === 'Elena Rivera'),
};

export const MOCK_ADMIN_DASHBOARD: AdminDashboard = {
  fullName: 'Institution Admin',
  totalUsers: 148,
  students: 122,
  teachers: 18,
  courses: courses.length,
  activeEnrollments: 313,
  courses_: courses,
  recentAnnouncements: announcements,
};
