import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect } from 'vitest';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { QuizService } from '../../../core/services/quiz.service';
import { Quiz, Subject } from '../../../core/models/quiz.model';

const SUBJECTS: Subject[] = [
  { id: 1, name: 'Data Structures', code: 'CS-201', createdAt: '', updatedAt: null },
];

const QUIZZES: Quiz[] = [
  {
    id: 1,
    title: 'Published quiz',
    isPublished: true,
    subjectId: 1,
    createdByTeacherId: 1,
    questions: [],
    results: [
      { id: 1, quizId: 1, studentId: 2, score: 3, completedAt: '', createdAt: '', updatedAt: null },
    ],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: null,
  },
];

function setup(quizService: Partial<QuizService>) {
  TestBed.configureTestingModule({
    imports: [AdminDashboardComponent],
    providers: [{ provide: QuizService, useValue: quizService }],
  });

  const fixture = TestBed.createComponent(AdminDashboardComponent);
  fixture.detectChanges();
  return fixture;
}

describe('AdminDashboardComponent', () => {
  it('renders institution-wide KPI cards once quizzes and subjects load', () => {
    const fixture = setup({
      getTeacherQuizzes: () => of(QUIZZES),
      getSubjectStats: () => of(SUBJECTS),
    });

    expect(fixture.nativeElement.textContent).toContain('Institution Overview');
    expect(fixture.nativeElement.textContent).toContain('Total Users');
  });

  it('breaks quiz performance down by subject', () => {
    const fixture = setup({
      getTeacherQuizzes: () => of(QUIZZES),
      getSubjectStats: () => of(SUBJECTS),
    });

    expect(fixture.nativeElement.textContent).toContain('Data Structures');
    // 1 quiz created, 1 published => 100% completion rate.
    expect(fixture.nativeElement.textContent).toContain('100%');
  });

  it('shows an error message when the quiz list fails to load', () => {
    const fixture = setup({
      getTeacherQuizzes: () => throwError(() => new Error('down')),
      getSubjectStats: () => of(SUBJECTS),
    });

    expect(fixture.nativeElement.textContent).toContain('Could not load dashboard data.');
  });
});
