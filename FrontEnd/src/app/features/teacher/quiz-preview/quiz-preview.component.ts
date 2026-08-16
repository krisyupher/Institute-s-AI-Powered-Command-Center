import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import {
  AnswerOption,
  CreateQuestionRequest,
  Question,
  QuizDraft,
  SaveQuizRequest,
} from '../../../core/models/quiz.model';
import { QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-quiz-preview',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'quiz-preview.component.html',
  styleUrl: 'quiz-preview.component.scss',
})
export class QuizPreviewComponent {
  private readonly api = inject(QuizService);

  protected readonly draft = signal<QuizDraft | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly published = signal(false);

  protected readonly optionLetters: AnswerOption[] = ['A', 'B', 'C', 'D'];

  constructor() {
    this.api.getDraftQuiz().subscribe({
      next: (draft) => {
        this.draft.set(draft);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the draft quiz.');
        this.loading.set(false);
      },
    });
  }

  // ---------------------------------------------------------------
  // Inline editing helpers — each handler replaces the draft with a new
  // object so the OnPush signal carries the change to the template.
  // ---------------------------------------------------------------

  protected setTitle(value: string): void {
    const draft = this.draft();
    if (!draft) return;
    this.draft.set({ ...draft, title: value });
  }

  protected updateQuestion(index: number, change: Partial<Question>): void {
    const draft = this.draft();
    if (!draft) return;
    const questions = draft.questions.map((question, i) =>
      i === index ? { ...question, ...change } : question,
    );
    this.draft.set({ ...draft, questions });
  }

  protected deleteQuestion(index: number): void {
    const draft = this.draft();
    if (!draft) return;
    const questions = draft.questions.filter((_, i) => i !== index);
    this.draft.set({ ...draft, questions });
  }

  protected onOptionInput(index: number, letter: AnswerOption, value: string): void {
    const key = `option${letter}` as const;
    this.updateQuestion(index, { [key]: value });
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

  // ---------------------------------------------------------------- save

  protected publishQuiz(): void {
    const draft = this.draft();
    if (!draft || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);

    const request: SaveQuizRequest = {
      title: draft.title.trim(),
      subjectId: draft.subjectId,
      isPublished: true,
      questions: draft.questions.map(
        (question): CreateQuestionRequest => ({
          text: question.text,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctAnswer: question.correctAnswer,
        }),
      ),
    };

    this.api.saveQuiz(request).subscribe({
      next: () => {
        this.published.set(true);
        this.saving.set(false);
        this.draft.set({ ...draft, isPublished: true });
      },
      error: () => {
        this.saveError.set('Could not publish the quiz. Please try again.');
        this.saving.set(false);
      },
    });
  }
}