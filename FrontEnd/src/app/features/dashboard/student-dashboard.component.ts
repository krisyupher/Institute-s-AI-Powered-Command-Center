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
      <header class="mb-6">
        <h1 class="text-2xl font-semibold">Welcome back, {{ dashboard.fullName }}</h1>
        <p class="mt-1 text-base-content/70">Here's where things stand this week.</p>
      </header>

      <section class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div class="card-body p-5">
            <div class="text-3xl font-semibold leading-tight">{{ dashboard.enrolledCourses }}</div>
            <div class="text-sm text-base-content/70">Enrolled courses</div>
          </div>
        </div>
        <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div class="card-body p-5">
            <div class="text-3xl font-semibold leading-tight">{{ dashboard.classesToday }}</div>
            <div class="text-sm text-base-content/70">Classes today</div>
          </div>
        </div>
        <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div class="card-body p-5">
            <div class="text-3xl font-semibold leading-tight">{{ dashboard.upcomingAssignments }}</div>
            <div class="text-sm text-base-content/70">Assignments due soon</div>
          </div>
        </div>
        <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div class="card-body p-5">
            <div class="text-3xl font-semibold leading-tight">
              {{ dashboard.averageGradePercent !== null ? dashboard.averageGradePercent + '%' : '—' }}
            </div>
            <div class="text-sm text-base-content/70">Average grade</div>
          </div>
        </div>
      </section>

      <section class="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div class="card bg-base-100 shadow-md border border-base-200 rounded-2xl">
          <div class="card-body">
            <p class="card-title">Next seven days</p>
            <app-occurrence-list
              [occurrences]="dashboard.nextSevenDays"
              emptyMessage="Nothing scheduled in the next week."
            />
          </div>
        </div>

        <div class="card bg-base-100 shadow-md border border-base-200 rounded-2xl">
          <div class="card-body">
            <p class="card-title">Due soon</p>
            @if (dashboard.dueSoon.length === 0) {
              <p class="italic text-base-content/60">No assignments due in the next two weeks.</p>
            } @else {
              <ul class="divide-y divide-base-200">
                @for (assignment of dashboard.dueSoon; track assignment.id) {
                  <li class="flex items-center justify-between gap-4 py-2">
                    <div>
                      <div class="font-medium">{{ assignment.title }}</div>
                      <div class="text-sm text-base-content/70">{{ assignment.courseCode }}</div>
                    </div>
                    <span class="text-sm whitespace-nowrap">
                      {{ assignment.dueAtUtc | date: 'EEE d MMM' : 'UTC' }}
                    </span>
                  </li>
                }
              </ul>
              <a routerLink="/assignments" class="link link-primary link-hover text-sm">
                View all assignments →
              </a>
            }
          </div>
        </div>
      </section>

      <section class="mt-6 card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
        <div class="card-body">
          <p class="card-title">Announcements</p>
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
