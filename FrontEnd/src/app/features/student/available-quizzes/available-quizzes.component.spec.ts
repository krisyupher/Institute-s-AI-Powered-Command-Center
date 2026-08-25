import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect } from 'vitest';

import { AvailableQuizzesComponent } from './available-quizzes.component';
import { QuizService } from '../../../core/services/quiz.service';
import { AvailableQuiz } from '../../../core/models/quiz.model';

/**
 * Regression coverage: this component used to be a static "coming soon" placeholder with
 * no way to reach a real quiz from the UI — a student had to know a quiz id and type the
 * URL by hand. These assertions pin the real listing + "Start quiz" link.
 */
const QUIZZES: AvailableQuiz[] = [
  {
    id: 7,
    title: 'Data Structures Midterm Review',
    subject: { id: 1, name: 'Data Structures', code: 'CS-201', createdAt: '', updatedAt: null },
    createdByTeacher: { id: 1, fullName: 'Elena Rivera' },
    questionCount: 3,
    publishedAt: '2026-03-01T00:00:00Z',
  },
];

function setup(quizService: Partial<QuizService>) {
  TestBed.configureTestingModule({
    imports: [AvailableQuizzesComponent],
    providers: [provideRouter([]), { provide: QuizService, useValue: quizService }],
  });

  const fixture = TestBed.createComponent(AvailableQuizzesComponent);
  fixture.detectChanges();
  return fixture;
}

describe('AvailableQuizzesComponent', () => {
  it('renders a card with a "Start quiz" link to /student/quizzes/:id for each published quiz', () => {
    const fixture = setup({ getAvailableQuizzes: () => of(QUIZZES) });

    const title = fixture.nativeElement.querySelector('.card-title');
    const startLink = fixture.nativeElement.querySelector('a.btn-primary');

    expect(title?.textContent?.trim()).toBe('Data Structures Midterm Review');
    expect(startLink?.getAttribute('href')).toBe('/student/quizzes/7');
  });

  it('shows an empty-state message when there are no published quizzes', () => {
    const fixture = setup({ getAvailableQuizzes: () => of([]) });
    expect(fixture.nativeElement.textContent).toContain('No quizzes are available yet');
  });

  it('shows an error alert when the quiz list fails to load', () => {
    const fixture = setup({
      getAvailableQuizzes: () => throwError(() => new Error('network down')),
    });
    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'Could not load available quizzes.',
    );
  });
});
