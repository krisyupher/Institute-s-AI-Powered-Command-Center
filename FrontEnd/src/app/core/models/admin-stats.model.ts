/** One completed or in-progress quiz attempt shown on the admin dashboard. */
export interface RecentAdminActivity {
  id: number;
  studentName: string;
  quizTitle: string;
  score: number;
  completedAt: string;
  status: 'Completed' | 'Pending';
}

/** Mirrors the response of `GET /api/admin/stats`. */
export interface AdminStats {
  totalUsers: number;
  quizzesGenerated: number;
  averageScore: number;
  recentActivity: RecentAdminActivity[];
}
