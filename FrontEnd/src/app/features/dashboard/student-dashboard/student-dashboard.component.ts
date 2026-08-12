import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { QuizService } from '../../../core/services/quiz.service';
import { AvailableQuiz, QuizResult } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-student-dashboard',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'student-dashboard.component.html',
})
export class StudentDashboardComponent {
  protected readonly api = inject(QuizService);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected upcomingQuizzes = signal<AvailableQuiz[]>([]);
  protected recentResults = signal<QuizResult[]>([]);

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
}
