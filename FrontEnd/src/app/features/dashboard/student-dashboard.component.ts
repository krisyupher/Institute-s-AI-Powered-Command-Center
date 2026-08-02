import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardApi } from '../../core/api/dashboard.api';
import { StudentDashboard } from '../../core/models/api.models';
import { OccurrenceListComponent } from '../../shared/occurrence-list.component';

@Component({
  selector: 'app-student-dashboard',
  imports: [DatePipe, RouterLink, OccurrenceListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (data(); as dashboard) {
      <header class="page-head">
        <h1>Welcome back, {{ dashboard.fullName }}</h1>
        <p class="muted">Here's where things stand this week.</p>
      </header>

      <section class="grid stats">
        <div class="card">
          <div class="stat-value">{{ dashboard.enrolledCourses }}</div>
          <div class="stat-label">Enrolled courses</div>
        </div>
        <div class="card">
          <div class="stat-value">{{ dashboard.classesToday }}</div>
          <div class="stat-label">Classes today</div>
        </div>
        <div class="card">
          <div class="stat-value">{{ dashboard.upcomingAssignments }}</div>
          <div class="stat-label">Assignments due soon</div>
        </div>
        <div class="card">
          <div class="stat-value">
            {{ dashboard.averageGradePercent !== null ? dashboard.averageGradePercent + '%' : '—' }}
          </div>
          <div class="stat-label">Average grade</div>
        </div>
      </section>

      <section class="grid columns">
        <div class="card">
          <p class="card-title">Next seven days</p>
          <app-occurrence-list
            [occurrences]="dashboard.nextSevenDays"
            emptyMessage="Nothing scheduled in the next week."
          />
        </div>

        <div class="card">
          <p class="card-title">Due soon</p>
          @if (dashboard.dueSoon.length === 0) {
            <p class="empty">No assignments due in the next two weeks.</p>
          } @else {
            <ul class="plain">
              @for (assignment of dashboard.dueSoon; track assignment.id) {
                <li>
                  <div>
                    <div class="title">{{ assignment.title }}</div>
                    <div class="muted small">{{ assignment.courseCode }}</div>
                  </div>
                  <span class="small">{{ assignment.dueAtUtc | date: 'EEE d MMM' : 'UTC' }}</span>
                </li>
              }
            </ul>
            <a routerLink="/assignments" class="small">View all assignments →</a>
          }
        </div>
      </section>

      <section class="card">
        <p class="card-title">Announcements</p>
        @if (dashboard.recentAnnouncements.length === 0) {
          <p class="empty">No announcements.</p>
        } @else {
          @for (item of dashboard.recentAnnouncements; track item.id) {
            <article class="announcement">
              <div class="announcement-head">
                <strong>{{ item.title }}</strong>
                <span class="badge">{{ item.courseCode ?? 'Institution' }}</span>
              </div>
              <p class="muted small">{{ item.body }}</p>
              <p class="muted small">
                {{ item.authorName }} · {{ item.publishedAtUtc | date: 'd MMM' : 'UTC' }}
              </p>
            </article>
          }
        }
      </section>
    } @else if (error()) {
      <p class="error-text">{{ error() }}</p>
    } @else {
      <p class="muted">Loading…</p>
    }
  `,
  styles: `
    .page-head {
      margin-bottom: 1.25rem;
    }

    .stats {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      margin-bottom: 1rem;
    }

    .columns {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-bottom: 1rem;
      align-items: start;
    }

    .plain {
      list-style: none;
      margin: 0 0 0.75rem;
      padding: 0;
    }

    .plain li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
    }

    .plain li:last-child {
      border-bottom: none;
    }

    .title {
      font-weight: 500;
    }

    .announcement {
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--border);
    }

    .announcement:last-child {
      border-bottom: none;
    }

    .announcement-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }

    .announcement p {
      margin: 0.25rem 0 0;
    }
  `,
})
export class StudentDashboardComponent {
  private readonly api = inject(DashboardApi);

  protected readonly data = signal<StudentDashboard | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.api.student().subscribe({
      next: (dashboard) => this.data.set(dashboard),
      error: () => this.error.set('Could not load your dashboard.'),
    });
  }
}
