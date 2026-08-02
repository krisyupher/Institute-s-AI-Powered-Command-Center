import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Placeholder for routes the dashboards link to but that are not implemented yet
 * (courses, assignments). Exists so those links land somewhere honest instead of
 * failing navigation.
 */
@Component({
  selector: 'app-not-built',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card max-w-2xl bg-base-100 shadow-md border border-base-200 rounded-2xl">
      <div class="card-body">
        <h1 class="card-title text-2xl">Not built yet</h1>
        <p class="text-base-content/70">
          This page is part of the planned feature set but has not been implemented. Only the
          dashboard is available so far.
        </p>
        <div class="card-actions mt-2">
          <a routerLink="/dashboard" class="btn btn-primary btn-sm">← Back to dashboard</a>
        </div>
      </div>
    </section>
  `,
})
export class NotBuiltComponent {}
