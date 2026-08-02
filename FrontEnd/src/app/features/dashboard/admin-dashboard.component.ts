import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardApi } from '../../core/api/dashboard.api';
import { AdminDashboard } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (data(); as dashboard) {
      <header class="page-head">
        <h1>Institution overview</h1>
        <p class="muted">Signed in as {{ dashboard.fullName }}.</p>
      </header>

      <section class="grid stats">
        <div class="card">
          <div class="stat-value">{{ dashboard.totalUsers }}</div>
          <div class="stat-label">Total users</div>
        </div>
        <div class="card">
          <div class="stat-value">{{ dashboard.students }}</div>
          <div class="stat-label">Students</div>
        </div>
        <div class="card">
          <div class="stat-value">{{ dashboard.teachers }}</div>
          <div class="stat-label">Teachers</div>
        </div>
        <div class="card">
          <div class="stat-value">{{ dashboard.courses }}</div>
          <div class="stat-label">Courses</div>
        </div>
        <div class="card">
          <div class="stat-value">{{ dashboard.activeEnrollments }}</div>
          <div class="stat-label">Active enrollments</div>
        </div>
      </section>

      <section class="card">
        <p class="card-title">All courses</p>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Course</th>
              <th>Teacher</th>
              <th>Term</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            @for (course of dashboard.courses_; track course.id) {
              <tr>
                <td><a [routerLink]="['/courses', course.id]">{{ course.code }}</a></td>
                <td>{{ course.name }}</td>
                <td>{{ course.teacherName }}</td>
                <td>{{ course.term }}</td>
                <td>{{ course.enrolledStudents }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section class="card announcements">
        <p class="card-title">Recent announcements</p>
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
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      margin-bottom: 1rem;
    }

    .announcements {
      margin-top: 1rem;
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
export class AdminDashboardComponent {
  private readonly api = inject(DashboardApi);

  protected readonly data = signal<AdminDashboard | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.api.admin().subscribe({
      next: (dashboard) => this.data.set(dashboard),
      error: () => this.error.set('Could not load the dashboard.'),
    });
  }
}
