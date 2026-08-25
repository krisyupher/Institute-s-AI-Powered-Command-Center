import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { TakeQuizComponent } from './take-quiz.component';
import { QuizService } from '../../../core/services/quiz.service';
import { Quiz, SubmitQuizResponse } from '../../../core/models/quiz.model';

const QUIZ: Quiz = {
  id: 1,
  title: 'Data Structures Midterm Review',
  isPublished: true,
  subjectId: 1,
  createdByTeacherId: 1,
  results: [],
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: null,
  questions: [
    {
      id: 101,
      quizId: 1,
      text: 'Question 1',
      optionA: 'A1',
      optionB: 'B1',
      optionC: 'C1',
      optionD: 'D1',
      correctAnswer: 'A',
      createdAt: '',
      updatedAt: null,
    },
    {
      id: 102,
      quizId: 1,
      text: 'Question 2',
      optionA: 'A2',
      optionB: 'B2',
      optionC: 'C2',
      optionD: 'D2',
      correctAnswer: 'B',
      createdAt: '',
      updatedAt: null,
    },
  ],
};

function setup(quizService: Partial<QuizService>, quizId = '1') {
  TestBed.configureTestingModule({
    imports: [TakeQuizComponent],
    providers: [provideRouter([]), { provide: QuizService, useValue: quizService }],
  });

  const fixture = TestBed.createComponent(TakeQuizComponent);
  fixture.componentRef.setInput('quizId', quizId);
  fixture.detectChanges();
  return fixture;
}

describe('TakeQuizComponent', () => {
  it('shows an error and does not call the API for an invalid (empty) quiz id', () => {
    const getQuizById = vi.fn();
    const fixture = setup({ getQuizById }, '');

    expect(getQuizById).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'Invalid quiz.',
    );
  });

  it('shows an error when the quiz fails to load', () => {
    const fixture = setup({ getQuizById: () => throwError(() => new Error('down')) });
    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'Could not load this quiz.',
    );
  });

  it('renders the first question with four radio options and a 0-of-N progress bar', () => {
    const fixture = setup({ getQuizById: () => of(QUIZ) });

    expect(fixture.nativeElement.textContent).toContain('Question 1');
    expect(fixture.nativeElement.querySelectorAll('input[type="radio"]').length).toBe(4);
    const progress: HTMLProgressElement = fixture.nativeElement.querySelector('progress');
    expect(progress.getAttribute('max')).toBe('2');
    expect(progress.value).toBe(0);
  });

  it('answering a question advances the progress bar and enables "Next"', () => {
    const fixture = setup({ getQuizById: () => of(QUIZ) });

    fixture.nativeElement.querySelector('input[type="radio"]').click();
    fixture.detectChanges();

    const progress: HTMLProgressElement = fixture.nativeElement.querySelector('progress');
    expect(progress.value).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('1 of 2 answered');
  });

  it('disables "Submit Quiz" until every question is answered, then enables it', () => {
    const fixture = setup({ getQuizById: () => of(QUIZ) });

    // Answer Q1, move to Q2 (last question) — Submit should appear but stay disabled.
    fixture.nativeElement.querySelector('input[type="radio"]').click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button.btn-primary') as HTMLButtonElement).click(); // Next
    fixture.detectChanges();

    let submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button.btn-primary',
    );
    expect(submitBtn.textContent).toContain('Submit Quiz');
    expect(submitBtn.disabled).toBe(true);

    fixture.nativeElement.querySelector('input[type="radio"]').click();
    fixture.detectChanges();

    submitBtn = fixture.nativeElement.querySelector('button.btn-primary');
    expect(submitBtn.disabled).toBe(false);
  });

  it('opens a confirmation modal before submitting, and submits on confirm', () => {
    const result: SubmitQuizResponse = {
      quizId: 1,
      studentId: 2,
      score: 2,
      totalQuestions: 2,
      correctCount: 2,
      completedAt: '2026-03-06T10:00:00Z',
    };
    const submitQuiz = vi.fn(() => of(result));
    const fixture = setup({ getQuizById: () => of(QUIZ), submitQuiz });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // Answer both questions.
    fixture.nativeElement.querySelector('input[type="radio"]').click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button.btn-primary') as HTMLButtonElement).click(); // Next
    fixture.detectChanges();
    fixture.nativeElement.querySelector('input[type="radio"]').click();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button.btn-primary') as HTMLButtonElement).click(); // Submit Quiz
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeTruthy();
    expect(submitQuiz).not.toHaveBeenCalled();

    const confirmBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.modal-action button.btn-primary',
    );
    confirmBtn.click();

    expect(submitQuiz).toHaveBeenCalledWith({ quizId: 1, answers: { 101: 'A', 102: 'A' } });
    expect(navigateSpy).toHaveBeenCalledWith(['/student/results'], { state: { result } });
  });

  it('shows a submit error and keeps the modal reachable when submission fails', () => {
    const submitQuiz = vi.fn(() => throwError(() => new Error('down')));
    const fixture = setup({ getQuizById: () => of(QUIZ), submitQuiz });

    fixture.nativeElement.querySelector('input[type="radio"]').click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button.btn-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('input[type="radio"]').click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button.btn-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.modal-action button.btn-primary') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'Could not submit your answers.',
    );
  });
});
