/**
 * Mirrors the response of `GET /api/admin/stats`
 * (docs/PROJECT_PLAN.md): total users, total AI-generated quizzes,
 * and the global average score.
 */
export interface AdminStats {
  totalUsers: number;
  totalAiGeneratedQuizzes: number;
  globalAverageScore: number;
}
