import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { MOCK_USERS } from '../mock/mock-data';
import { User, UserRole } from '../models/user.model';

const ROLE_KEY = 'institute.mockRole';

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Quiz/exam auth client. Method signatures match `POST /api/auth/login` and the
 * JWT claims; bodies currently serve mock data, so swapping in `this.http.post`
 * requires no caller changes.
 *
 * Also carries the shell's demo-role affordance (`role`, `user`, `homeRoute`,
 * `setRole`) used by the header/sidebar role-switch. `readRole` accepts the
 * legacy `'Administrator' | 'Staff'` values written by the old scaffold so a
 * stored demo role degrades gracefully to `'Student'`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly latencyMs = 250;

  private readonly currentRole = signal<UserRole>(this.readRole());

  readonly role = this.currentRole.asReadonly();
  readonly user = computed<User>(
    () => MOCK_USERS.find((u) => u.role === this.currentRole()) ?? MOCK_USERS[0],
  );
  readonly isAuthenticated = computed(() => true);

  // Where a signed-in user belongs, derived from their role.
  readonly homeRoute = computed(() => {
    switch (this.role()) {
      case 'Student':
        return '/dashboard/student';
      case 'Teacher':
        return '/dashboard/teacher';
      case 'Admin':
        return '/dashboard/admin';
      default:
        return '/dashboard/student';
    }
  });

  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.currentRole());
  }

  // Demo affordance: lets the shell switch roles without a login round-trip
  setRole(role: UserRole): void {
    this.currentRole.set(role);
    localStorage.setItem(ROLE_KEY, role);
  }

  // Returns the authenticated user (mock: first user matching the email)
  login(credentials: LoginRequest): Observable<User> {
    const user = MOCK_USERS.find((u) => u.email === credentials.email) ?? MOCK_USERS[0];
    return of(user).pipe(delay(AuthService.latencyMs));
  }

  // Returns the currently signed-in user
  getCurrentUser(): Observable<User | null> {
    return of(this.user()).pipe(delay(AuthService.latencyMs));
  }

  // Convenience: look up a user by id
  getUserById(id: number): Observable<User | undefined> {
    return of(MOCK_USERS.find((u) => u.id === id)).pipe(delay(AuthService.latencyMs));
  }

  private readRole(): UserRole {
    const stored = localStorage.getItem(ROLE_KEY);
    return stored === 'Admin' || stored === 'Teacher' || stored === 'Student'
      ? stored
      : 'Student';
  }
}
