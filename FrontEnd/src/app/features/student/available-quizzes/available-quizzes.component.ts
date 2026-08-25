import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AvailableQuiz } from '../../../core/models/quiz.model';
import { QuizService } from '../../../core/services/quiz.service';

/**
 * Entry point into the student quiz-taking flow: lists published quizzes and links each
 * one to `/student/quizzes/:quizId` (`TakeQuizComponent`). Was a static placeholder with
 * no way to reach a real quiz other than typing the URL by hand.
 */
@Component({
  selector: 'app-available-quizzes',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'available-quizzes.component.html',
})
export class AvailableQuizzesComponent {
  private readonly quizService = inject(QuizService);

  protected readonly quizzes = signal<AvailableQuiz[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  constructor() {
    this.quizService.getAvailableQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes.set(quizzes);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load available quizzes.');
        this.loading.set(false);
      },
    });
  }
}
