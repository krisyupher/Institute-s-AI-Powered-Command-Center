import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  protected readonly api = inject(QuizService);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected dashboard = signal<any>(null);
  protected quizStats = signal<any>({ totalQuizzes: 0, completedQuizzes: 0, avgScore: 0 });
  protected quizSubjectStats = signal<any[]>([]);
  protected recentActivities = signal<any[]>([]);
  protected subjectNames = signal<Record<number, string>>({});

  constructor() {
    this.api.getTeacherQuizzes().subscribe({
      next: (quizzes) => {
        this.processQuizStats(quizzes);
        this.quizStats.set({
          totalQuizzes: quizzes.length,
          completedQuizzes: quizzes.filter(q => q.isPublished).length,
          avgScore: 78,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Could not load dashboard data.');
        this.loading.set(false);
      },
    });
    this.api.getSubjectStats().subscribe({
      next: (subjects) => this.loadSubjectMeta(subjects),
    });
  }

  private loadSubjectMeta(subjects: any[]) {
    // Store subject names keyed by id for the stats table
    this.subjectNames.set(
      subjects.reduce((acc, s) => {
        acc[s.id] = s.name;
        return acc;
      }, {} as Record<number, string>),
    );
  }

  private loadDashboardData() {
    // Simulated institution-wide metrics (replaced by GET /api/admin/stats in prod)
    this.dashboard.set({
      totalUsers: 148,
      students: 122,
      teachers: 18,
      courses: 4,
    });
  }

  private processQuizStats(quizzes: any[]) {
    this.loadDashboardData();

    // Group quizzes by subject for statistics
    const subjectMap = new Map<number, { name: string; created: number; published: number; scores: number[] }>();

    quizzes.forEach((q: any) => {
      const key = q.subjectId;
      const entry = subjectMap.get(key) ?? {
        name: this.subjectNames()[key] ?? `Subject ${key}`,
        created: 0,
        published: 0,
        scores: [],
      };
      entry.created++;
      if (q.isPublished) entry.published++;
      (q.results ?? []).forEach((r: any) => entry.scores.push(r.score));
      subjectMap.set(key, entry);
    });

    this.quizSubjectStats.set(
      Array.from(subjectMap.entries()).map(([id, e]) => ({
        id,
        name: e.name,
        quizzesCreated: e.created,
        quizzesPublished: e.published,
        avgScore: e.scores.length
          ? Math.round(e.scores.reduce((a, b) => a + b, 0) / e.scores.length)
          : 0,
        completionRate: e.created ? Math.round((e.published / e.created) * 100) : 0,
      })),
    );

    // Simulated recent activity feed (replaced by a real endpoint in prod)
    this.recentActivities.set([
      {
        id: 'a1',
        title: 'Data Structures Midterm Review',
        student: 'Ana Morales',
        date: '2026-03-06',
        status: 'completed',
      },
      {
        id: 'a2',
        title: 'Physics: Momentum Basics',
        student: 'Liam Okafor',
        date: '2026-03-07',
        status: 'completed',
      },
      {
        id: 'a3',
        title: 'Linear Algebra - Draft',
        student: 'Ana Morales',
        date: '2026-03-08',
        status: 'pending',
      },
    ]);
  }
}
