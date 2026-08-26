import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdminStats } from '../models/admin-stats.model';

/** Admin client for `GET /api/admin/stats`. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin`;

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.baseUrl}/stats`);
  }
}
