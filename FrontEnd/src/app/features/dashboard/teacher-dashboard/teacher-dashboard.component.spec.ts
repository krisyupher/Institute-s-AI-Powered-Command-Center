import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect } from 'vitest';

import { TeacherDashboardComponent } from './teacher-dashboard.component';
import { QuizService } from '../../../core/services/quiz.service';
import { Quiz } from '../../../core/models/quiz.model';

const QUIZZES: Quiz[] = [
  {
    id: 1,
    title: 'Published quiz',
    isPublished: true,
    subjectId: 1,
    createdByTeacherId: 1,
    questions: [],
    results: [
      { id: 1, quizId: 1, studentId: 2, score: 2, completedAt: '', createdAt: '', updatedAt: null },
    ],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 2,
    title: 'Draft quiz',
    isPublished: false,
    subjectId: 1,
    createdByTeacherId: 1,
    questions: [],
    results: [],
    createdAt: '2026-03-02T00:00:00Z',
    updatedAt: null,
  },
];

function setup(quizService: Partial<QuizService>) {
  TestBed.configureTestingModule({
    imports: [TeacherDashboardComponent],
    providers: [provideRouter([]), { provide: QuizService, useValue: quizService }],
  });

  const fixture = TestBed.createComponent(TeacherDashboardComponent);
  fixture.detectChanges();
  return fixture;
}

describe('TeacherDashboardComponent', () => {
  it('summarizes created, published and attempted counts from the quiz list', () => {
    const fixture = setup({ getTeacherQuizzes: () => of(QUIZZES) });

    const counts = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('.text-3xl'),
    ).map((el) => el.textContent?.trim());

    expect(counts).toEqual(['2', '1', '1']); // created, published, student attempts
    expect(fixture.nativeElement.textContent).toContain('Published quiz');
    expect(fixture.nativeElement.textContent).toContain('Draft quiz');
  });

  it('shows an error message when quizzes fail to load', () => {
    const fixture = setup({ getTeacherQuizzes: () => throwError(() => new Error('down')) });
    expect(fixture.nativeElement.textContent).toContain('Could not load quizzes.');
  });
});
