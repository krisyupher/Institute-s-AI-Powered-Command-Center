import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject as RxSubject, of, throwError } from 'rxjs';

import { QuizGeneratorComponent } from './quiz-generator.component';
import { QuizService } from '../../../core/services/quiz.service';
import { Question, Subject } from '../../../core/models/quiz.model';

const SUBJECTS: Subject[] = [
  { id: 1, name: 'Data Structures', code: 'CS-201', createdAt: '2026-01-01T00:00:00Z', updatedAt: null },
  { id: 2, name: 'Linear Algebra', code: 'MAT-150', createdAt: '2026-01-01T00:00:00Z', updatedAt: null },
];

const DRAFT_QUESTIONS: Question[] = [
  {
    id: -1, quizId: -1, text: 'Draft question 1', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
    correctAnswer: 'A', createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
  },
];

function fillRequiredFields(fixture: ComponentFixture<QuizGeneratorComponent>): void {
  const el = fixture.nativeElement as HTMLElement;
  const subjectSelect = el.querySelector<HTMLSelectElement>('select[formcontrolname="subjectId"]')!;
  subjectSelect.value = subjectSelect.options[1].value; // first real subject, not the placeholder
  subjectSelect.dispatchEvent(new Event('change'));

  const topicInput = el.querySelector<HTMLInputElement>('input[formcontrolname="topic"]')!;
  topicInput.value = 'Binary search trees';
  topicInput.dispatchEvent(new Event('input'));

  fixture.detectChanges();
}

function submitForm(fixture: ComponentFixture<QuizGeneratorComponent>): void {
  (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('QuizGeneratorComponent', () => {
  let fixture: ComponentFixture<QuizGeneratorComponent>;
  let quizApi: QuizService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizGeneratorComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    // Injected and spied on BEFORE createComponent() — the component's constructor
    // calls getSubjectStats() immediately, so the spy must already be in place.
    quizApi = TestBed.inject(QuizService);
    vi.spyOn(quizApi, 'getSubjectStats').mockReturnValue(of(SUBJECTS));

    fixture = TestBed.createComponent(QuizGeneratorComponent);
  });

  it('loads subjects into the Subject select on init', () => {
    fixture.detectChanges();

    const options = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'select[formcontrolname="subjectId"] option',
    );
    // Placeholder option + the two loaded subjects
    expect(options.length).toBe(3);
    expect(options[1].textContent).toContain('Data Structures');
  });

  it('rejects submission with a missing subject and topic without calling generateQuiz', () => {
    const generateSpy = vi.spyOn(quizApi, 'generateQuiz');
    fixture.detectChanges();

    submitForm(fixture);

    expect(generateSpy).not.toHaveBeenCalled();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Choose a subject.');
    expect(text).toContain('Topic is required.');
  });

  it('sends the captured criteria to QuizService.generateQuiz on submit', () => {
    vi.spyOn(quizApi, 'generateQuiz').mockReturnValue(of(DRAFT_QUESTIONS));
    fixture.detectChanges();
    fillRequiredFields(fixture);

    submitForm(fixture);

    expect(quizApi.generateQuiz).toHaveBeenCalledWith({
      subjectId: 1,
      difficulty: 'Medium',
      topic: 'Binary search trees',
      questionCount: 5,
    });
  });

  it('shows a loading spinner while generating and disables the button', () => {
    const pending = new RxSubject<Question[]>();
    vi.spyOn(quizApi, 'generateQuiz').mockReturnValue(pending.asObservable());
    fixture.detectChanges();
    fillRequiredFields(fixture);

    submitForm(fixture);

    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.disabled).toBe(true);
    expect(el.querySelector('.loading-spinner')).toBeTruthy();

    pending.next(DRAFT_QUESTIONS);
    pending.complete();
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
    expect(el.querySelector('.loading-spinner')).toBeFalsy();
  });

  it('shows a success message with a link to preview once the draft comes back', () => {
    vi.spyOn(quizApi, 'generateQuiz').mockReturnValue(of(DRAFT_QUESTIONS));
    fixture.detectChanges();
    fillRequiredFields(fixture);

    submitForm(fixture);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Draft generated with 1 question.');
    expect(el.querySelector('a[href="/teacher/preview"]')).toBeTruthy();
  });

  it('shows an error alert when generation fails', () => {
    vi.spyOn(quizApi, 'generateQuiz').mockReturnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();
    fillRequiredFields(fixture);

    submitForm(fixture);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Could not generate a draft quiz. Please try again.',
    );
  });
});
