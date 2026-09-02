import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { AnswerOption, Question, Quiz } from '../../../core/models/quiz.model';
import { QuizService } from '../../../core/services/quiz.service';

/**
 * Ticket 4.3: step-by-step test runner. One question per screen with a
 * progress bar tracking how many are answered, and a confirmation modal
 * before the final submit — grading happens immediately on the backend, so
 * answers can't be revised afterward.
 */
@Component({
  selector: 'app-take-quiz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'take-quiz.component.html',
  styleUrl: 'take-quiz.component.scss',
})
export class TakeQuizComponent implements OnInit {
  private readonly api = inject(QuizService);
  private readonly router = inject(Router);

  /** Bound from the route parameter by `withComponentInputBinding()`. */
  readonly quizId = input('');

  protected readonly quiz = signal<Quiz | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly currentIndex = signal(0);
  protected readonly answers = signal<Record<number, AnswerOption>>({});

  protected readonly showConfirm = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly optionLetters: readonly AnswerOption[] = ['A', 'B', 'C', 'D'];

  protected readonly totalQuestions = computed(() => this.quiz()?.questions.length ?? 0);
  protected readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  protected readonly currentQuestion = computed<Question | null>(
    () => this.quiz()?.questions[this.currentIndex()] ?? null,
  );
  protected readonly isLastQuestion = computed(
    () => this.currentIndex() === this.totalQuestions() - 1,
  );
  protected readonly allAnswered = computed(
    () => this.totalQuestions() > 0 && this.answeredCount() === this.totalQuestions(),
  );

  ngOnInit(): void {
    const id = Number(this.quizId());
    if (!id) {
      this.loadError.set('Invalid quiz.');
      this.loading.set(false);
      return;
    }

    this.api.getQuizById(id).subscribe({
      next: (quiz) => {
        if (!quiz) {
          this.loadError.set('Quiz not found.');
        } else {
          this.quiz.set(quiz);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load this quiz.');
        this.loading.set(false);
      },
    });
  }

  protected optionText(question: Question, letter: AnswerOption): string {
    switch (letter) {
      case 'A':
        return question.optionA;
      case 'B':
        return question.optionB;
      case 'C':
        return question.optionC;
      case 'D':
        return question.optionD;
    }
  }

  protected selectAnswer(questionId: number, letter: AnswerOption): void {
    this.answers.set({ ...this.answers(), [questionId]: letter });
  }

  protected goPrevious(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.set(this.currentIndex() - 1);
    }
  }

  protected goNext(): void {
    if (this.currentIndex() < this.totalQuestions() - 1) {
      this.currentIndex.set(this.currentIndex() + 1);
    }
  }

  protected jumpTo(index: number): void {
    this.currentIndex.set(index);
  }

  protected askSubmit(): void {
    if (!this.submitting()) {
      this.showConfirm.set(true);
    }
  }

  protected cancelSubmit(): void {
    if (!this.submitting()) {
      this.showConfirm.set(false);
    }
  }

  protected confirmSubmit(): void {
    const quiz = this.quiz();
    if (!quiz || this.submitting()) return;

    this.submitting.set(true);
    this.submitError.set(null);

    this.api.submitQuiz({ quizId: quiz.id, answers: this.answers() }).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.showConfirm.set(false);
        // The backend verdict (QuestionResultResponse) carries no question
        // text, so enrich each row with the text from the quiz we still hold
        // in memory before handing the whole thing to the results card via
        // router state. Ticket 4.4 reads this from router state; falls back
        // to a fresh fetch of the student's results if it misses it
        // (refresh, etc).
        const questionResults = (result.questionResults ?? []).map((r) => {
          const q = quiz.questions.find((x) => x.id === r.questionId);
          return {
            ...r,
            text: q?.text ?? `Question #${r.questionId}`,
            optionA: q?.optionA,
            optionB: q?.optionB,
            optionC: q?.optionC,
            optionD: q?.optionD,
          };
        });
        this.router.navigate(['/student/results'], {
          state: { result: { ...result, questionResults } },
        });
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set('Could not submit your answers. Please try again.');
      },
    });
  }
}
