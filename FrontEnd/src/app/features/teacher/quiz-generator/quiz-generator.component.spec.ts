import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { QuizGeneratorComponent } from './quiz-generator.component';
import { QuizService } from '../../../core/services/quiz.service';
import { QuizDraft, Subject } from '../../../core/models/quiz.model';

const SUBJECTS: Subject[] = [
  { id: 1, name: 'Data Structures', code: 'CS-201', createdAt: '', updatedAt: null },
];

const DRAFT: QuizDraft = {
  id: 0,
  title: 'Data Structures — Binary trees',
  isPublished: false,
  subjectId: 1,
  createdByTeacherId: 1,
  difficulty: 'Medium',
  subjectName: 'Data Structures',
  createdAt: '',
  updatedAt: null,
  results: [],
  questions: [],
};

function setup(quizService: Partial<QuizService>) {
  TestBed.configureTestingModule({
    imports: [QuizGeneratorComponent],
    providers: [provideRouter([]), { provide: QuizService, useValue: quizService }],
  });

  const fixture = TestBed.createComponent(QuizGeneratorComponent);
  fixture.detectChanges();
  return fixture;
}

/** Picks the (only) loaded subject option; index 0 is the disabled placeholder. */
function chooseFirstSubject(fixture: ReturnType<typeof setup>) {
  const select: HTMLSelectElement = fixture.nativeElement.querySelector(
    'select[formcontrolname="subjectId"]',
  );
  select.value = select.options[1].value;
  select.dispatchEvent(new Event('change'));
}

describe('QuizGeneratorComponent', () => {
  it('loads and renders the subject options', () => {
    const fixture = setup({ getSubjectStats: () => of(SUBJECTS) });
    const select: HTMLSelectElement = fixture.nativeElement.querySelector(
      'select[formcontrolname="subjectId"]',
    );
    expect(select.options[1].textContent).toContain('Data Structures');
  });

  it('shows an error when subjects fail to load', () => {
    const fixture = setup({ getSubjectStats: () => throwError(() => new Error('down')) });
    expect(fixture.nativeElement.textContent).toContain('Could not load subjects.');
  });

  it('does not generate and shows validation errors when the form is invalid', () => {
    const generateQuiz = vi.fn();
    const fixture = setup({ getSubjectStats: () => of(SUBJECTS), generateQuiz });

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(generateQuiz).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Choose a subject.');
  });

  it('generates a draft and navigates to the preview screen with it in router state', () => {
    const generateQuiz = vi.fn(() => of(DRAFT));
    const fixture = setup({ getSubjectStats: () => of(SUBJECTS), generateQuiz });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    chooseFirstSubject(fixture);
    const topic: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[formcontrolname="topic"]',
    );
    topic.value = 'Binary trees';
    topic.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(generateQuiz).toHaveBeenCalledWith({
      subjectId: 1,
      difficulty: 'Medium',
      topic: 'Binary trees',
      questionCount: 5,
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/teacher/preview'], { state: { draftQuiz: DRAFT } });
  });

  it('shows an error and stops generating when the API call fails', () => {
    const generateQuiz = vi.fn(() => throwError(() => new Error('down')));
    const fixture = setup({ getSubjectStats: () => of(SUBJECTS), generateQuiz });

    chooseFirstSubject(fixture);
    const topic: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[formcontrolname="topic"]',
    );
    topic.value = 'Binary trees';
    topic.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'Could not generate a draft quiz.',
    );
  });
});
