import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdminStats } from '../models/admin-stats.model';

// Development fallback for `GET /api/admin/stats` until Ticket 4.2 is available.
const MOCK_ADMIN_STATS: AdminStats = {
  totalUsers: 128,
  quizzesGenerated: 45,
  averageScore: 78.5,
  recentActivity: [
    {
      id: 1,
      studentName: 'Ana Morales',
      quizTitle: 'Data Structures Fundamentals',
      score: 92,
      completedAt: '2026-08-21T14:30:00Z',
      status: 'Completed',
    },
    {
      id: 2,
      studentName: 'Liam Okafor',
      quizTitle: 'Physics: Momentum Basics',
      score: 68,
      completedAt: '2026-08-21T11:15:00Z',
      status: 'Completed',
    },
    {
      id: 3,
      studentName: 'Priya Shah',
      quizTitle: 'Introduction to SQL',
      score: 84,
      completedAt: '2026-08-20T16:45:00Z',
      status: 'Completed',
    },
    {
      id: 4,
      studentName: 'Noah Wilson',
      quizTitle: 'Linear Algebra Review',
      score: 73,
      completedAt: '2026-08-20T09:10:00Z',
      status: 'Completed',
    },
  ],
};

/** Admin client for `GET /api/admin/stats`, with a development mock fallback. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin`;
  private static readonly latencyMs = 250;

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.baseUrl}/stats`).pipe(
      catchError(() => of(MOCK_ADMIN_STATS).pipe(delay(AdminService.latencyMs))),
    );
  }
}
