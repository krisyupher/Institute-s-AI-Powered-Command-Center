import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdminQuiz, AdminStats } from '../../../core/models/admin-stats.model';
import { AdminService } from '../../../core/services/admin.service';
import { QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly quizService = inject(QuizService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly stats = signal<AdminStats | null>(null);
  protected readonly quizzes = signal<AdminQuiz[]>([]);
  protected readonly deleteTarget = signal<AdminQuiz | null>(null);
  protected readonly deleting = signal(false);

  ngOnInit(): void {
    forkJoin({
      stats: this.adminService.getAdminStats(),
      quizzes: this.adminService.getAdminQuizzes(),
    }).subscribe({
      next: ({ stats, quizzes }) => {
        this.stats.set(stats);
        this.quizzes.set(quizzes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the system analytics. Please try again shortly.');
        this.loading.set(false);
      },
    });
  }

  protected askDelete(quiz: AdminQuiz): void {
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
    this.quizService.deleteQuiz(target.id).subscribe({
      next: () => {
        this.quizzes.set(this.quizzes().filter((q) => q.id !== target.id));
        this.deleting.set(false);
        this.deleteTarget.set(null);
      },
      error: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.error.set('Could not delete the quiz.');
      },
    });
  }
}
