import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { QuizService } from '../../../core/services/quiz.service';
import { Quiz } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterLink, NgClass, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'teacher-dashboard.component.html',
})
export class TeacherDashboardComponent {
  protected readonly api = inject(QuizService);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected myQuizzes = signal<Quiz[]>([]);

  constructor() {
    this.api.getTeacherQuizzes().subscribe({
      next: (quizzes) => {
        this.myQuizzes.set(quizzes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load quizzes.');
        this.loading.set(false);
      },
    });
  }

  protected publishedQuizzes = () => this.myQuizzes().filter(q => q.isPublished);
  protected totalResults = () => this.myQuizzes().reduce((acc, q) => acc + (q.results?.length || 0), 0);
}
