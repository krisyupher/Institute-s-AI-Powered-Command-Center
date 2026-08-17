import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';
import { UserRole } from '../models/user.model';

// These are needed but not used.
const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

/** Run the guard and get result. */
function runGuard(...roles: UserRole[]) {
  return TestBed.runInInjectionContext(() => roleGuard(...roles)(ROUTE, STATE));
}

describe('roleGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it.each<{ role: UserRole; allowed: UserRole[] }>([
    { role: 'Teacher', allowed: ['Teacher'] },
    { role: 'Admin', allowed: ['Admin'] },
    { role: 'Admin', allowed: ['Teacher', 'Admin'] },
  ])('lets a $role into a route that allows $allowed', ({ role, allowed }) => {
    TestBed.inject(AuthService).setRole(role);
    expect(runGuard(...allowed)).toBe(true);
  });

  it('redirects a Student to /student/quizzes when the route needs Teacher', () => {
    TestBed.inject(AuthService).setRole('Student');
    const result = runGuard('Teacher');
    expect(String(result)).toBe('/student/quizzes');
  });

  it('redirects a Teacher to /teacher/quizzes when the route needs Admin', () => {
    TestBed.inject(AuthService).setRole('Teacher');
    const result = runGuard('Admin');
    expect(String(result)).toBe('/teacher/quizzes');
  });

  it('blocks a Student from both /teacher and /admin routes', () => {
    TestBed.inject(AuthService).setRole('Student');
    expect(String(runGuard('Teacher'))).toBe('/student/quizzes');
    expect(String(runGuard('Admin'))).toBe('/student/quizzes');
  });
});