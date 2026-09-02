import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect } from 'vitest';

import { AdminDashboardPageComponent } from './admin-dashboard-page.component';
import { AdminService } from '../../../core/services/admin.service';
import { QuizService } from '../../../core/services/quiz.service';
import { AdminStats } from '../../../core/models/admin-stats.model';

const FAKE_STATS: AdminStats = {
  totalUsers: 10,
  totalQuizzes: 5,
  averageScore: 78.5,
};

describe('AdminDashboardPageComponent', () => {
  it('renders the live admin analytics dashboard', () => {
    TestBed.configureTestingModule({
      imports: [AdminDashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AdminService,
          useValue: {
            getAdminStats: () => of(FAKE_STATS),
            getAdminQuizzes: () => of([]),
          },
        },
        { provide: QuizService, useValue: { deleteQuiz: () => of(undefined) } },
      ],
    });
    const fixture = TestBed.createComponent(AdminDashboardPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Admin Analytics Dashboard');
    expect(fixture.nativeElement.textContent).toContain('10'); // totalUsers
    expect(fixture.nativeElement.textContent).toContain('5'); // totalQuizzes
  });
});
