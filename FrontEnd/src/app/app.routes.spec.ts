import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';

/** Ticket 1.5 acceptance criteria: every defined URL loads its placeholder page. */
const CASES: ReadonlyArray<{ url: string; expect: string }> = [
  { url: '/login', expect: 'Login Coming Soon' },
  { url: '/teacher/generator', expect: 'Teacher Quiz Generator Coming Soon' },
  { url: '/teacher/quizzes', expect: 'Teacher Quiz List Coming Soon' },
  { url: '/student/quizzes', expect: 'Student Quiz List Coming Soon' },
  { url: '/student/quizzes/42', expect: 'Take Quiz Coming Soon' },
  { url: '/student/results', expect: 'Student Results Coming Soon' },
  { url: '/admin/dashboard', expect: 'Admin Dashboard Coming Soon' },
];

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

  for (const testCase of CASES) {
    it(`loads the placeholder for ${testCase.url}`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(testCase.url);
      expect(harness.routeNativeElement?.textContent).toContain(testCase.expect);
    });
  }

  it('binds the route param to the take-quiz page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/student/quizzes/abc123');
    expect(harness.routeNativeElement?.textContent).toContain('/student/quizzes/abc123');
  });

  it('sends an unknown url to the dashboard', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/nope');
    expect(TestBed.inject(Router).url).toBe('/dashboard/student');
  });
});
