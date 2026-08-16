/**
 * Realistic mock dataset for the quiz/exam feature, shaped exactly like the
 * TypeScript models in `core/models` (which mirror the backend entities).
 *
 * Ids are stable numbers so service methods can look things up the same way
 * the real `GET` endpoints will (by id, not by array index).
 */

import {
  AvailableQuiz,
  Question,
  Quiz,
  QuizResult,
  Subject,
} from '../models/quiz.model';
import { User } from '../models/user.model';

// ------------------------------- Users -------------------------------

export const MOCK_USERS: User[] = [
  {
    id: 1,
    fullName: 'Elena Rivera',
    email: 'e.rivera@institute.edu',
    role: 'Teacher',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: null,
  },
  {
    id: 2,
    fullName: 'Ana Morales',
    email: 'ana.morales@institute.edu',
    role: 'Student',
    createdAt: '2026-01-12T10:30:00Z',
    updatedAt: null,
  },
  {
    id: 3,
    fullName: 'Liam Okafor',
    email: 'l.okafor@institute.edu',
    role: 'Student',
    createdAt: '2026-01-15T08:15:00Z',
    updatedAt: null,
  },
  {
    id: 4,
    fullName: 'Inst Admin',
    email: 'admin@institute.edu',
    role: 'Admin',
    createdAt: '2026-01-05T07:45:00Z',
    updatedAt: null,
  },
];

// ------------------------------ Subjects -----------------------------

export const MOCK_SUBJECTS: Subject[] = [
  { id: 1, name: 'Data Structures', code: 'CS-201', createdAt: '2026-02-01T09:00:00Z', updatedAt: null },
  { id: 2, name: 'Classical Mechanics', code: 'PHY-110', createdAt: '2026-02-01T09:05:00Z', updatedAt: null },
  { id: 3, name: 'Linear Algebra', code: 'MAT-150', createdAt: '2026-02-01T09:10:00Z', updatedAt: null },
];

// ------------------------------ Questions ----------------------------

const qs1: Question[] = [
  {
    id: 11,
    quizId: 1,
    text: 'What is the amortized cost of appending to a dynamic array?',
    optionA: 'O(1)',
    optionB: 'O(log n)',
    optionC: 'O(n)',
    optionD: 'O(n log n)',
    correctAnswer: 'A',
    createdAt: '2026-03-02T11:00:00Z',
    updatedAt: null,
  },
  {
    id: 12,
    quizId: 1,
    text: 'Which traversal visits the root before its children in a binary tree?',
    optionA: 'In-order',
    optionB: 'Pre-order',
    optionC: 'Post-order',
    optionD: 'Level-order',
    correctAnswer: 'B',
    createdAt: '2026-03-02T11:01:00Z',
    updatedAt: null,
  },
  {
    id: 13,
    quizId: 1,
    text: 'A hash table with open addressing resolves collisions by…',
    optionA: 'Chaining linked lists',
    optionB: 'Probing other slots',
    optionC: 'Rebalancing the tree',
    optionD: 'Ignoring the collision',
    correctAnswer: 'B',
    createdAt: '2026-03-02T11:02:00Z',
    updatedAt: null,
  },
];

const qs2: Question[] = [
  {
    id: 21,
    quizId: 2,
    text: 'Newton’s second law in vector form is…',
    optionA: 'F = ma',
    optionB: 'F = mv',
    optionC: 'F = m/a',
    optionD: 'F = m + a',
    correctAnswer: 'A',
    createdAt: '2026-03-05T14:00:00Z',
    updatedAt: null,
  },
  {
    id: 22,
    quizId: 2,
    text: 'Momentum is conserved when…',
    optionA: 'External forces are present',
    optionB: 'No net external force acts',
    optionC: 'Kinetic energy is always constant',
    optionD: 'The system is at rest',
    correctAnswer: 'B',
    createdAt: '2026-03-05T14:01:00Z',
    updatedAt: null,
  },
];

const qs3: Question[] = [
  {
    id: 31,
    quizId: 3,
    text: 'The null space of a matrix is…',
    optionA: 'The set of vectors that map to the zero vector',
    optionB: 'The column space after row reduction',
    optionC: 'The transpose of the row space',
    optionD: 'The determinant of the matrix',
    correctAnswer: 'A',
    createdAt: '2026-03-08T16:30:00Z',
    updatedAt: null,
  },
  {
    id: 32,
    quizId: 3,
    text: 'Two vectors are linearly independent when…',
    optionA: 'One is a scalar multiple of the other',
    optionB: 'Neither is a scalar multiple of the other',
    optionC: 'Both have the same length',
    optionD: 'Their dot product is positive',
    correctAnswer: 'B',
    createdAt: '2026-03-08T16:31:00Z',
    updatedAt: null,
  },
  {
    id: 33,
    quizId: 3,
    text: 'The rank of a 3×3 matrix with three pivot columns is…',
    optionA: '1',
    optionB: '2',
    optionC: '3',
    optionD: 'Undefined',
    correctAnswer: 'C',
    createdAt: '2026-03-08T16:32:00Z',
    updatedAt: null,
  },
];

// ------------------------------- Quizzes -----------------------------

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 1,
    title: 'Data Structures Midterm Review',
    isPublished: true,
    subjectId: 1,
    createdByTeacherId: 1,
    questions: qs1,
    results: [],
    createdAt: '2026-03-02T11:00:00Z',
    updatedAt: '2026-03-03T09:00:00Z',
  },
  {
    id: 2,
    title: 'Physics: Momentum Basics',
    isPublished: true,
    subjectId: 2,
    createdByTeacherId: 1,
    questions: qs2,
    results: [],
    createdAt: '2026-03-05T14:00:00Z',
    updatedAt: null,
  },
  {
    id: 3,
    title: 'Linear Algebra — Draft (unpublished)',
    isPublished: false,
    subjectId: 3,
    createdByTeacherId: 1,
    questions: qs3,
    results: [],
    createdAt: '2026-03-08T16:30:00Z',
    updatedAt: null,
  },
];

// ---------------------------- Quiz results ---------------------------

export const MOCK_QUIZ_RESULTS: QuizResult[] = [
  {
    id: 1,
    quizId: 1,
    studentId: 2,
    score: 2,
    completedAt: '2026-03-06T10:12:00Z',
    createdAt: '2026-03-06T10:12:00Z',
    updatedAt: null,
  },
  {
    id: 2,
    quizId: 2,
    studentId: 3,
    score: 1,
    completedAt: '2026-03-07T13:40:00Z',
    createdAt: '2026-03-07T13:40:00Z',
    updatedAt: null,
  },
];

// --------------------------- Derived exports -------------------------

// Published quizzes (for the student "available quizzes" list)
export const MOCK_AVAILABLE_QUIZZES: AvailableQuiz[] = MOCK_QUIZZES.filter(
  (q) => q.isPublished,
).map((q) => {
  const subject = MOCK_SUBJECTS.find((s) => s.id === q.subjectId)!;
  const teacher = MOCK_USERS.find((u) => u.id === q.createdByTeacherId)!;
  return {
    id: q.id,
    title: q.title,
    subject,
    createdByTeacher: { id: teacher.id, fullName: teacher.fullName },
    questionCount: q.questions.length,
    publishedAt: q.updatedAt ?? q.createdAt,
  };
});
