import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import { UserRole } from './core/models/user.model';

/** Ticket 1.5 acceptance criteria: every defined URL loads its placeholder page. */
const CASES: ReadonlyArray<{ url: string; expect: string; role: UserRole }> = [
  { url: '/login', expect: 'Login Coming Soon', role: 'Student' },
  { url: '/teacher/generator', expect: 'Teacher Quiz Generator Coming Soon', role: 'Teacher' },
  { url: '/teacher/quizzes', expect: 'Teacher Quiz List Coming Soon', role: 'Teacher' },
  { url: '/student/quizzes', expect: 'Student Quiz List Coming Soon', role: 'Student' },
  { url: '/student/quizzes/42', expect: 'Take Quiz Coming Soon', role: 'Student' },
  { url: '/student/results', expect: 'Student Results Coming Soon', role: 'Student' },
  { url: '/admin/dashboard', expect: 'Admin Dashboard Coming Soon', role: 'Admin' },
];

describe('app routes', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

  for (const testCase of CASES) {
    it(`loads the placeholder for ${testCase.url}`, async () => {
      TestBed.inject(AuthService).setRole(testCase.role);
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(testCase.url);
      expect(harness.routeNativeElement?.textContent).toContain(testCase.expect);
    });
  }

  it('binds the route param to the take-quiz page', async () => {
    TestBed.inject(AuthService).setRole('Student');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/student/quizzes/abc123');
    expect(harness.routeNativeElement?.textContent).toContain('/student/quizzes/abc123');
  });

  it('sends an unknown url to the dashboard', async () => {
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    // The `**` fallback redirects to `/dashboard`, whose DashboardRedirectComponent then
    // imperatively navigates to the role's home page (`/dashboard/student`). That chained
    // navigation is async, so wait for its NavigationEnd before asserting the final URL.
    const settled = firstValueFrom(
      router.events.pipe(
        filter(
          (e): e is NavigationEnd => e instanceof NavigationEnd && e.url === '/dashboard/student',
        ),
      ),
    );
    await harness.navigateByUrl('/nope');
    await settled;
    expect(router.url).toBe('/dashboard/student');
  });
});