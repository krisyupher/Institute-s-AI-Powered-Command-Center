import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { AdminStats } from '../models/admin-stats.model';

// Mock payload for `GET /api/admin/stats`
const MOCK_ADMIN_STATS: AdminStats = {
  totalUsers: 148,
  totalAiGeneratedQuizzes: 42,
  globalAverageScore: 81.4,
};

/**
 * Admin client. Currently serves mock data; the method signature matches
 * `GET /api/admin/stats` from docs/PROJECT_PLAN.md.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private static readonly latencyMs = 250;

  getAdminStats(): Observable<AdminStats> {
    return of(MOCK_ADMIN_STATS).pipe(delay(AdminService.latencyMs));
  }
}
