import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect } from 'vitest';

import { StudentDashboardComponent } from './student-dashboard.component';
import { QuizService } from '../../../core/services/quiz.service';
import { AvailableQuiz, QuizResult } from '../../../core/models/quiz.model';

const QUIZZES: AvailableQuiz[] = [
  {
    id: 1,
    title: 'Data Structures Midterm Review',
    subject: { id: 1, name: 'Data Structures', code: 'CS-201', createdAt: '', updatedAt: null },
    createdByTeacher: { id: 1, fullName: 'Elena Rivera' },
    questionCount: 3,
    publishedAt: '2026-03-01T00:00:00Z',
  },
];

const RESULTS: QuizResult[] = [
  {
    id: 1,
    quizId: 1,
    studentId: 2,
    score: 2,
    completedAt: '2026-03-06T10:00:00Z',
    createdAt: '2026-03-06T10:00:00Z',
    updatedAt: null,
  },
];

function setup(quizService: Partial<QuizService>) {
  TestBed.configureTestingModule({
    imports: [StudentDashboardComponent],
    providers: [provideRouter([]), { provide: QuizService, useValue: quizService }],
  });

  const fixture = TestBed.createComponent(StudentDashboardComponent);
  fixture.detectChanges();
  return fixture;
}

describe('StudentDashboardComponent', () => {
  it('renders upcoming quizzes and recent results', () => {
    const fixture = setup({
      getAvailableQuizzes: () => of(QUIZZES),
      getStudentResults: () => of(RESULTS),
    });

    expect(fixture.nativeElement.textContent).toContain('Data Structures Midterm Review');
    expect(fixture.nativeElement.textContent).toContain('Score: 2');
  });

  it('shows an error message when quizzes fail to load', () => {
    const fixture = setup({
      getAvailableQuizzes: () => throwError(() => new Error('down')),
      getStudentResults: () => of([]),
    });

    expect(fixture.nativeElement.textContent).toContain('Could not load quizzes.');
  });

  it('shows the empty-results copy when the student has no results yet', () => {
    const fixture = setup({
      getAvailableQuizzes: () => of([]),
      getStudentResults: () => of([]),
    });

    expect(fixture.nativeElement.textContent).toContain("You haven't taken any quizzes yet");
  });
});
