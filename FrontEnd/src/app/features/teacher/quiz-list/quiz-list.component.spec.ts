import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { QuizListComponent } from './quiz-list.component';
import { QuizService } from '../../../core/services/quiz.service';
import { Quiz, Subject } from '../../../core/models/quiz.model';

const SUBJECTS: Subject[] = [
  { id: 1, name: 'Data Structures', code: 'CS-201', createdAt: '', updatedAt: null },
];

const QUIZZES: Quiz[] = [
  {
    id: 1,
    title: 'Data Structures Midterm Review',
    isPublished: true,
    subjectId: 1,
    createdByTeacherId: 1,
    questions: [
      {
        id: 1,
        quizId: 1,
        text: 'Q1',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'A',
        createdAt: '',
        updatedAt: null,
      },
    ],
    results: [],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: null,
  },
];

function setup(quizService: Partial<QuizService>) {
  TestBed.configureTestingModule({
    imports: [QuizListComponent],
    providers: [provideRouter([]), { provide: QuizService, useValue: quizService }],
  });

  const fixture = TestBed.createComponent(QuizListComponent);
  fixture.detectChanges();
  return fixture;
}

describe('QuizListComponent', () => {
  it("renders each quiz's title, resolved subject name, question count and status", () => {
    const fixture = setup({
      getTeacherQuizzes: () => of(QUIZZES),
      getSubjectStats: () => of(SUBJECTS),
    });

    const row = fixture.nativeElement.querySelector('tbody tr');
    expect(row.textContent).toContain('Data Structures Midterm Review');
    expect(row.textContent).toContain('Data Structures');
    expect(row.textContent).toContain('Published');
  });

  it('shows an empty state with a "Create New Quiz" call to action when there are no quizzes', () => {
    const fixture = setup({
      getTeacherQuizzes: () => of([]),
      getSubjectStats: () => of([]),
    });

    expect(fixture.nativeElement.textContent).toContain('No quizzes yet');
  });

  it('shows an error message when the quiz list fails to load', () => {
    const fixture = setup({
      getTeacherQuizzes: () => throwError(() => new Error('down')),
      getSubjectStats: () => of(SUBJECTS),
    });

    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'Could not load your quizzes.',
    );
  });

  it('asks for confirmation before deleting, and removes the row only after confirming', () => {
    const deleteQuiz = vi.fn(() => of(undefined));
    const fixture = setup({
      getTeacherQuizzes: () => of(QUIZZES),
      getSubjectStats: () => of(SUBJECTS),
      deleteQuiz,
    });

    fixture.nativeElement.querySelector('button.text-error').click(); // "Delete" row action
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeTruthy();
    expect(deleteQuiz).not.toHaveBeenCalled();

    const confirmBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.modal-action button.btn-error',
    );
    confirmBtn.click();

    expect(deleteQuiz).toHaveBeenCalledWith(1);
  });

  it('closes the modal without deleting when the delete is cancelled', () => {
    const deleteQuiz = vi.fn(() => of(undefined));
    const fixture = setup({
      getTeacherQuizzes: () => of(QUIZZES),
      getSubjectStats: () => of(SUBJECTS),
      deleteQuiz,
    });

    fixture.nativeElement.querySelector('button.text-error').click();
    fixture.detectChanges();

    const cancelBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.modal-action button:not(.btn-error)',
    );
    cancelBtn.click();
    fixture.detectChanges();

    expect(deleteQuiz).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });
});
