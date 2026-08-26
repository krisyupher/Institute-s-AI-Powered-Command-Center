/** Mirrors the response of `GET /api/admin/stats`. */
export interface AdminStats {
  totalUsers: number;
  totalQuizzes: number;
  averageScore: number;
}

/**
 * One quiz in the admin all-quizzes view, mirroring the backend
 * `AdminQuizResponse` (GET /api/admin/quizzes): system-wide attempt stats
 * plus the creator's name.
 */
export interface AdminQuiz {
  id: number;
  title: string;
  isPublished: boolean;
  subjectId: number;
  subjectName: string;
  createdByTeacherName: string;
  questionCount: number;
  attempts: number;
  averageScore: number;
  createdAt: string;
  updatedAt: string | null;
}
