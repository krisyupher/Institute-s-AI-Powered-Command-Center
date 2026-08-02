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
      <header class="mb-6">
        <h1 class="text-2xl font-semibold">Institution overview</h1>
        <p class="mt-1 text-base-content/70">Signed in as {{ dashboard.fullName }}.</p>
      </header>

      <section class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div class="card-body p-5">
            <div class="text-3xl font-semibold leading-tight">{{ dashboard.totalUsers }}</div>
            <div class="text-sm text-base-content/70">Total users</div>
          </div>
        </div>
        <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div class="card-body p-5">
            <div class="text-3xl font-semibold leading-tight">{{ dashboard.students }}</div>
            <div class="text-sm text-base-content/70">Students</div>
          </div>
        </div>
        <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div class="card-body p-5">
            <div class="text-3xl font-semibold leading-tight">{{ dashboard.teachers }}</div>
            <div class="text-sm text-base-content/70">Teachers</div>
          </div>
        </div>
        <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div class="card-body p-5">
            <div class="text-3xl font-semibold leading-tight">{{ dashboard.courses }}</div>
            <div class="text-sm text-base-content/70">Courses</div>
          </div>
        </div>
        <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div class="card-body p-5">
            <div class="text-3xl font-semibold leading-tight">{{ dashboard.activeEnrollments }}</div>
            <div class="text-sm text-base-content/70">Active enrollments</div>
          </div>
        </div>
      </section>

      <section class="mt-6 card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
        <div class="card-body">
          <p class="card-title">All courses</p>
          <div class="overflow-x-auto">
            <table class="table table-sm">
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
                    <td><a [routerLink]="['/courses', course.id]" class="link link-primary">{{ course.code }}</a></td>
                    <td>{{ course.name }}</td>
                    <td>{{ course.teacherName }}</td>
                    <td>{{ course.term }}</td>
                    <td>{{ course.enrolledStudents }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="mt-6 card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
        <div class="card-body">
          <p class="card-title">Recent announcements</p>
          @if (dashboard.recentAnnouncements.length === 0) {
            <p class="italic text-base-content/60">No announcements.</p>
          } @else {
            @for (item of dashboard.recentAnnouncements; track item.id) {
              <article class="border-b border-base-200 py-2 last:border-b-0">
                <div class="flex items-center justify-between gap-3">
                  <strong>{{ item.title }}</strong>
                  <span class="badge badge-primary badge-sm">{{ item.courseCode ?? 'Institution' }}</span>
                </div>
                <p class="mt-1 text-sm text-base-content/70">{{ item.body }}</p>
                <p class="mt-1 text-sm text-base-content/70">
                  {{ item.authorName }} · {{ item.publishedAtUtc | date: 'd MMM' : 'UTC' }}
                </p>
              </article>
            }
          }
        </div>
      </section>
    } @else if (error()) {
      <p class="text-error">{{ error() }}</p>
    } @else {
      <p class="text-base-content/70">Loading…</p>
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
