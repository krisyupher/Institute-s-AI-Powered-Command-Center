import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Quiz, Subject } from '../../../core/models/quiz.model';
import { QuizService } from '../../../core/services/quiz.service';

/**
 * Ticket 3.5: teacher quiz management list view. Loads the teacher's quizzes
 * from `QuizService` (real GET with mock fallback) plus the subject catalog
 * so each row can render a subject name, then lists them in a DaisyUI table.
 */
@Component({
  selector: 'app-quiz-list',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'quiz-list.component.html',
  styleUrl: 'quiz-list.component.scss',
})
export class QuizListComponent {
  private readonly api = inject(QuizService);

  protected readonly quizzes = signal<Quiz[]>([]);
  protected readonly subjects = signal<Subject[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  // Quiz awaiting delete confirmation (DaisyUI modal) — null when no modal is open.
  protected readonly deleteTarget = signal<Quiz | null>(null);
  protected readonly deleting = signal(false);

  constructor() {
    forkJoin({
      quizzes: this.api.getTeacherQuizzes(),
      subjects: this.api.getSubjectStats(),
    }).subscribe({
      next: ({ quizzes, subjects }) => {
        this.quizzes.set(quizzes);
        this.subjects.set(subjects);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load your quizzes.');
        this.loading.set(false);
      },
    });
  }

  protected subjectName(subjectId: number): string {
    return this.subjects().find((s) => s.id === subjectId)?.name ?? `Subject #${subjectId}`;
  }

  protected askDelete(quiz: Quiz): void {
    if (!this.deleting()) {
      this.deleteTarget.set(quiz);
    }
  }

  protected cancelDelete(): void {
    if (!this.deleting()) {
      this.deleteTarget.set(null);
    }
  }

  protected confirmedDelete(): void {
    const target = this.deleteTarget();
    if (!target) {
      return;
    }
    this.deleting.set(true);
    this.api.deleteQuiz(target.id).subscribe({
      next: () => {
        this.quizzes.set(this.quizzes().filter((q) => q.id !== target.id));
        this.deleting.set(false);
        this.deleteTarget.set(null);
      },
      error: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.loadError.set('Could not delete the quiz.');
      },
    });
  }
}