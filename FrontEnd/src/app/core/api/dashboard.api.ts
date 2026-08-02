import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import {
  MOCK_ADMIN_DASHBOARD,
  MOCK_STUDENT_DASHBOARD,
  MOCK_TEACHER_DASHBOARD,
} from '../mock/dashboard.mock';
import { AdminDashboard, StudentDashboard, TeacherDashboard } from '../models/api.models';

/**
 * Dashboard client. Currently serves mock data because `BackEnd/` does not exist yet;
 * the method signatures already match `GET /api/dashboard/{student|teacher|admin}`, so
 * wiring the real API means replacing the bodies with `this.http.get(...)` and nothing
 * in the components changes.
 *
 * The small delay keeps the components' loading branch on a real code path.
 */
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private static readonly latencyMs = 250;

  student(): Observable<StudentDashboard> {
    return of(MOCK_STUDENT_DASHBOARD).pipe(delay(DashboardApi.latencyMs));
  }

  teacher(): Observable<TeacherDashboard> {
    return of(MOCK_TEACHER_DASHBOARD).pipe(delay(DashboardApi.latencyMs));
  }

  admin(): Observable<AdminDashboard> {
    return of(MOCK_ADMIN_DASHBOARD).pipe(delay(DashboardApi.latencyMs));
  }
}
