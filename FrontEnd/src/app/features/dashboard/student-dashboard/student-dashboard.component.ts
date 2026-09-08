import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { QuizService } from '../../../core/services/quiz.service';
import { AvailableQuiz, QuizResult } from '../../../core/models/quiz.model';
import { StatePanelComponent } from '../../../shared/components/state-panel/state-panel.component';

@Component({
  selector: 'app-student-dashboard',
  imports: [RouterLink, DatePipe, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'student-dashboard.component.html',
})
export class StudentDashboardComponent {
  protected static readonly PASSING_PERCENT = 60;

  protected readonly api = inject(QuizService);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected upcomingQuizzes = signal<AvailableQuiz[]>([]);
  protected recentResults = signal<QuizResult[]>([]);

  protected readonly passingPercent = StudentDashboardComponent.PASSING_PERCENT;
  protected readonly progressSummary = computed(() => {
    const results = this.recentResults();
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);

    return {
      available: this.upcomingQuizzes().length,
      completed: results.length,
      averageScore: results.length > 0 ? Math.round(totalScore / results.length) : 0,
    };
  });

  constructor() {
    this.api.getAvailableQuizzes().subscribe({
      next: (quizzes) => {
        this.upcomingQuizzes.set(quizzes);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Could not load quizzes.');
        this.loading.set(false);
      },
    });

    this.api.getStudentResults().subscribe({
      next: (results) => {
        this.recentResults.set(results);
      },
      error: (err) => {
        this.error.update(e => e || 'Could not load results.');
      },
    });
  }

  protected isPassed(result: QuizResult): boolean {
    return result.score >= StudentDashboardComponent.PASSING_PERCENT;
  }
}
