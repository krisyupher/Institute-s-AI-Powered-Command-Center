import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'quiz-preview.component.html',
  styleUrl: 'quiz-preview.component.scss',
})
export class QuizPreviewComponent implements OnInit {
  private readonly api = inject(QuizService);
  private readonly router = inject(Router);

  /** Route input (`/teacher/preview/:quizId`); undefined when editing a fresh draft. */
  readonly quizId = input<string>();

  protected readonly draft = signal<QuizDraft | null>(null);
  protected readonly loading = signal(true);
  protected readonly isFallbackData = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly published = signal(false);
  private readonly dragFromId = signal<number | null>(null);
  protected readonly dragTarget = signal<number | null>(null);
  /** True when loaded from the quiz list (edit mode) so save updates, not inserts. */
  protected readonly editing = signal(false);

  protected readonly optionLetters: AnswerOption[] = ['A', 'B', 'C', 'D'];

  constructor() {
    // IMPORTANT: this.quizId() must NOT be read here. Route params bind to
    // component inputs only after construction (withComponentInputBinding),
    // so it is still undefined in the constructor. Defer to ngOnInit.
  }

  ngOnInit(): void {
    // Edit mode: navigated from the quiz list with an id — load that quiz
    // (HTTP with mock fallback) and populate the editor so the teacher can
    // rework and re-publish it. Takes priority over any stale router draft.
    const idParam = this.quizId();
    if (idParam) {
      this.loadQuizById(Number(idParam));
      return;
    }

    // Fresh-publish flow: the generator hands a quiz over via router state
    // (Ticket 3.3). `history.state` survives an in-tab refresh; navigation
    // extras do not, so read the persisted pushState object directly.
    const stateQuizDraft = (window.history.state as
      | { draftQuiz?: QuizDraft }
      | null)?.draftQuiz;

    if (stateQuizDraft?.questions?.length) {
      this.draft.set(stateQuizDraft);
      this.loading.set(false);
      return;
    }

    // No generator state and no id (e.g. reached via the dashboard "Review
    // Draft" button or a hard refresh): serve the mock draft so the screen
    // never breaks.
    this.api.getDraftQuiz().subscribe({
      next: (draft) => {
        this.draft.set(draft);
        this.isFallbackData.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the draft quiz.');
        this.loading.set(false);
      },
    });
  }

  /** Loads a persisted quiz by id and maps it into the editable `QuizDraft`. */
  private loadQuizById(id: number): void {
    this.api.getQuizById(id).subscribe({
      next: (quiz) => {
        if (!quiz) {
          this.error.set('Quiz not found.');
          this.loading.set(false);
          return;
        }
        // Resolve the subject display name (QuizDraft carries it for the UI;
        // the persisted Quiz only holds the foreign key).
        this.api.getSubjectStats().subscribe({
          next: (subjects) => {
            this.draft.set({
              ...quiz,
              difficulty: 'Medium',
              subjectName:
                subjects.find((s) => s.id === quiz.subjectId)?.name ??
                `Subject #${quiz.subjectId}`,
            });
            this.published.set(quiz.isPublished);
            this.isFallbackData.set(false);
            // Edit mode: save must UPDATE this row, not insert a new one.
            this.editing.set(true);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Could not load the quiz.');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('Could not load the quiz.');
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

  protected addQuestion(): void {
    const draft = this.draft();
    if (!draft) return;
    const newQuestion: Question = {
      id: -1, // placeholder
      quizId: draft.id || 0,
      text: 'New question',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      createdAt: Date.now().toString(), // convert to string
      updatedAt: null,
    };
    this.draft.set({
      ...draft,
      questions: [...draft.questions, newQuestion],
    });
  }

  protected dragStart(index: number, event: DragEvent): void {
    const draft = this.draft();
    const q = draft?.questions[index];
    if (!q) return;
    // Track the dragged question by its stable id, not a drifting index.
    this.dragFromId.set(q.id);
    this.dragTarget.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(q.id));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected dragOver(index: number, event: DragEvent): void {
    // Must preventDefault() on dragover so the browser treats the card as a
    // valid drop target and keeps firing dragenter.
    event.preventDefault();
    const fromId = this.dragFromId();
    const draft = this.draft();
    if (fromId === null || !draft) return;

    // Where is the dragged question right now? Recompute each event so the
    // index never drifts as items reorder live.
    const currentIndex = draft.questions.findIndex((q) => q.id === fromId);
    if (currentIndex < 0) return;

    this.dragTarget.set(index);

    // Live-reorder: remove the dragged item and insert at the hovered slot,
    // so the DOM updates immediately without waiting for `drop` (which is
    // unreliable over form inputs).
    if (currentIndex === index) return;
    const questions = [...draft.questions];
    const [moved] = questions.splice(currentIndex, 1);
    questions.splice(index, 0, moved);
    this.draft.set({ ...draft, questions });
  }

  protected dragEnd(): void {
    this.clearDrag();
  }

  protected dragDrop(event: DragEvent): void {
    // Called if a native drop still lands; live-reorder already applied the
    // change during dragover, so just finalize state.
    event.preventDefault();
    this.clearDrag();
  }

  private clearDrag(): void {
    this.dragFromId.set(null);
    this.dragTarget.set(null);
  }

  protected trackByIndex(index: number): number {
    return index;
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
      ...(this.editing() ? { id: draft.id } : {}),
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
        // Back to the teacher's quiz list once the publish succeeds.
        this.router.navigate(['/teacher/quizzes']);
      },
      error: () => {
        this.saveError.set('Could not publish the quiz. Please try again.');
        this.saving.set(false);
      },
    });
  }

  /** Leave the editor without saving; return to the generator. */
  protected cancel(): void {
    this.router.navigate(['/teacher/generator']);
  }
}