/** Mirrors the response of `GET /api/admin/stats`. */
export interface AdminStats {
  totalUsers: number;
  totalQuizzes: number;
  averageScore: number;
}
