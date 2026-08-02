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
    <section class="card">
      <h1>Not built yet</h1>
      <p class="muted">
        This page is part of the planned feature set but has not been implemented. Only the
        dashboard is available so far.
      </p>
      <a routerLink="/dashboard">← Back to dashboard</a>
    </section>
  `,
})
export class NotBuiltComponent {}
