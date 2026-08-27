import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { QuizPreviewComponent } from './quiz-preview.component';
import { QuizService } from '../../../core/services/quiz.service';
import { Quiz, QuizDraft, SaveQuizResponse, Subject } from '../../../core/models/quiz.model';

const SUBJECTS: Subject[] = [
  { id: 1, name: 'Data Structures', code: 'CS-201', createdAt: '', updatedAt: null },
];

const DRAFT: QuizDraft = {
  id: 0,
  title: 'Data Structures — Photosynthesis basics',
  isPublished: false,
  subjectId: 1,
  createdByTeacherId: 1,
  difficulty: 'Medium',
  subjectName: 'Data Structures',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  results: [],
  questions: [
    {
      id: -1,
      quizId: 0,
      text: 'Sample question',
      optionA: 'A',
      optionB: 'B',
      optionC: 'C',
      optionD: 'D',
      correctAnswer: 'A',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: null,
    },
  ],
};

const PERSISTED_QUIZ: Quiz = { ...DRAFT, id: 42, isPublished: true };

function setup(quizService: Partial<QuizService>, quizId?: string) {
  TestBed.configureTestingModule({
    imports: [QuizPreviewComponent],
    providers: [provideRouter([]), { provide: QuizService, useValue: quizService }],
  });

  const fixture = TestBed.createComponent(QuizPreviewComponent);
  if (quizId !== undefined) {
    fixture.componentRef.setInput('quizId', quizId);
  }
  fixture.detectChanges();
  return fixture;
}

describe('QuizPreviewComponent', () => {
  afterEach(() => {
    history.replaceState(null, '');
  });

  it('falls back to the most recent draft (and flags it as fallback data) when there is no route id or router-state draft', () => {
    const fixture = setup({ getDraftQuiz: () => of(DRAFT) });

    const titleInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[placeholder="Quiz title"]',
    );
    expect(titleInput.value).toBe(DRAFT.title);
    expect(fixture.nativeElement.querySelector('.alert-info')?.textContent).toContain(
      'most recent unpublished draft',
    );
  });

  it('uses the draft handed off via router state from the generator, without a fallback call', () => {
    history.pushState({ draftQuiz: DRAFT }, '');
    const getDraftQuiz = vi.fn();
    const fixture = setup({ getDraftQuiz });

    const titleInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[placeholder="Quiz title"]',
    );
    expect(titleInput.value).toBe(DRAFT.title);
    expect(fixture.nativeElement.querySelector('.alert-info')).toBeNull();
    expect(getDraftQuiz).not.toHaveBeenCalled();
  });

  it('loads an existing quiz by route id in edit mode ("Update Quiz")', () => {
    const fixture = setup(
      {
        getQuizById: () => of(PERSISTED_QUIZ),
        getSubjectStats: () => of(SUBJECTS),
      },
      '42',
    );

    expect(fixture.nativeElement.textContent).toContain('Update Quiz');
  });

  it('publishes the quiz and navigates back to the quiz list on success', () => {
    const saveQuiz = vi.fn(
      () =>
        of({
          id: 1,
          title: DRAFT.title,
          subjectId: DRAFT.subjectId,
          isPublished: true,
          questionCount: 1,
        } satisfies SaveQuizResponse),
    );
    const fixture = setup({ getDraftQuiz: () => of(DRAFT), saveQuiz });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const publishBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button.btn-primary',
    );
    publishBtn.click();

    expect(saveQuiz).toHaveBeenCalledOnce();
    expect(navigateSpy).toHaveBeenCalledWith(['/teacher/quizzes']);
  });

  it('shows a save error and stays on the page when publish fails', () => {
    const saveQuiz = vi.fn(() => throwError(() => new Error('save failed')));
    const fixture = setup({ getDraftQuiz: () => of(DRAFT), saveQuiz });

    const publishBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button.btn-primary',
    );
    publishBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'Could not publish the quiz',
    );
  });

  it('regression: reserves bottom padding under the question cards so the sticky action bar never overlaps them', () => {
    // Guards the fix for the bug where the sticky Discard/Publish bar covered the last
    // visible row of whatever question card sat at the bottom of the viewport while
    // scrolling — see quiz-preview.component.html's `section.space-y-4`.
    const fixture = setup({ getDraftQuiz: () => of(DRAFT) });
    const section = fixture.nativeElement.querySelector('section.space-y-4');
    expect(section?.className).toContain('pb-24');
  });
});
