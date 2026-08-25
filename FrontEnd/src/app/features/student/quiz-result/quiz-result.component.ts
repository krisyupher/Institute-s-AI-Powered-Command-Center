import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { QuizResult, SubmitQuizResponse } from '../../../core/models/quiz.model';
import { QuizService } from '../../../core/services/quiz.service';

/**
 * Exit point of the quiz-taking flow: shows the score `TakeQuizComponent` just computed
 * (passed via router state, since there is no `GET /api/quiz/submit/:id` to re-fetch a
 * single result by id) plus the student's past results. Was a static placeholder that
 * silently discarded the auto-graded score — a student who finished a quiz got no
 * feedback at all.
 */
@Component({
  selector: 'app-quiz-result',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'quiz-result.component.html',
})
export class QuizResultComponent implements OnInit {
  private readonly quizService = inject(QuizService);

  protected readonly justSubmitted = signal<SubmitQuizResponse | null>(null);
  protected readonly pastResults = signal<QuizResult[]>([]);
  protected readonly loading = signal(true);

  protected readonly scorePercent = computed(() => {
    const result = this.justSubmitted();
    if (!result || result.totalQuestions === 0) return 0;
    return Math.round((result.correctCount / result.totalQuestions) * 100);
  });

  ngOnInit(): void {
    const stateResult = (window.history.state as { result?: SubmitQuizResponse } | null)?.result;
    if (stateResult) {
      this.justSubmitted.set(stateResult);
    }

    this.quizService.getStudentResults().subscribe({
      next: (results) => {
        this.pastResults.set(results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
