import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';

import { QuizResultComponent } from './quiz-result.component';
import { QuizService } from '../../../core/services/quiz.service';
import { QuizResult, SubmitQuizResponse } from '../../../core/models/quiz.model';

/**
 * Regression coverage: `TakeQuizComponent` computes the auto-graded score correctly and
 * hands it off via router state, but this component used to be a static "coming soon"
 * placeholder that ignored it — a student who finished a quiz got zero feedback. These
 * assertions pin the score actually being read from history.state and rendered.
 */
const PAST_RESULTS: QuizResult[] = [
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

function setup(historyState: { result?: SubmitQuizResponse } | null, pastResults: QuizResult[] = []) {
  history.pushState(historyState, '');

  TestBed.configureTestingModule({
    imports: [QuizResultComponent],
    providers: [
      provideRouter([]),
      { provide: QuizService, useValue: { getStudentResults: () => of(pastResults) } },
    ],
  });

  const fixture = TestBed.createComponent(QuizResultComponent);
  fixture.detectChanges();
  return fixture;
}

describe('QuizResultComponent', () => {
  afterEach(() => {
    history.replaceState(null, '');
  });

  it('shows the just-submitted score computed from router state', () => {
    const result: SubmitQuizResponse = {
      quizId: 1,
      studentId: 2,
      score: 2,
      totalQuestions: 3,
      correctCount: 2,
      completedAt: '2026-03-06T10:00:00Z',
    };
    const fixture = setup({ result });

    expect(fixture.nativeElement.textContent).toContain('Quiz submitted!');
    expect(fixture.nativeElement.textContent).toContain('67%');
    expect(fixture.nativeElement.textContent).toContain('2');
  });

  it('does not show the "just submitted" card when there is no router state', () => {
    const fixture = setup(null);
    expect(fixture.nativeElement.textContent).not.toContain('Quiz submitted!');
  });

  it('renders past results in the history table', () => {
    const fixture = setup(null, PAST_RESULTS);
    expect(fixture.nativeElement.textContent).toContain('Quiz #1');
  });

  it('shows an empty-state message when there is no submission and no history', () => {
    const fixture = setup(null, []);
    expect(fixture.nativeElement.textContent).toContain('No quiz results yet');
  });
});
