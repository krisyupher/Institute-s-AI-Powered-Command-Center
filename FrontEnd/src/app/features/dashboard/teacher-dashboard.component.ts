import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardApi } from '../../core/api/dashboard.api';
import { TeacherDashboard } from '../../core/models/api.models';
import { OccurrenceListComponent } from '../../shared/occurrence-list.component';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [DatePipe, RouterLink, OccurrenceListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (data(); as dashboard) {
      <header class="page-head">
        <h1>{{ dashboard.fullName }}</h1>
        <p class="muted">Your teaching overview.</p>
      </header>

      <section class="grid stats">
        <div class="card">
          <div class="stat-value">{{ dashboard.courses }}</div>
          <div class="stat-label">Courses taught</div>
        </div>
        <div class="card">
          <div class="stat-value">{{ dashboard.totalStudents }}</div>
          <div class="stat-label">Students</div>
        </div>
        <div class="card">
          <div class="stat-value">{{ dashboard.pendingSubmissions }}</div>
          <div class="stat-label">Submissions awaiting grading</div>
        </div>
      </section>

      <section class="grid columns">
        <div class="card">
          <p class="card-title">My courses</p>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Course</th>
                <th>Students</th>
              </tr>
            </thead>
            <tbody>
              @for (course of dashboard.myCourses; track course.id) {
                <tr>
                  <td><a [routerLink]="['/courses', course.id]">{{ course.code }}</a></td>
                  <td>{{ course.name }}</td>
                  <td>{{ course.enrolledStudents }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="card">
          <p class="card-title">Next seven days</p>
          <app-occurrence-list
            [occurrences]="dashboard.nextSevenDays"
            emptyMessage="Nothing scheduled in the next week."
          />
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
              <p class="muted small">{{ item.publishedAtUtc | date: 'd MMM' : 'UTC' }}</p>
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
export class TeacherDashboardComponent {
  private readonly api = inject(DashboardApi);

  protected readonly data = signal<TeacherDashboard | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.api.teacher().subscribe({
      next: (dashboard) => this.data.set(dashboard),
      error: () => this.error.set('Could not load your dashboard.'),
    });
  }
}
