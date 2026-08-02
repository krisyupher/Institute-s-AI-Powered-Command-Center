import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

/**
 * Named `...PageComponent` to stay distinct from the existing
 * `features/dashboard/admin-dashboard.component.ts`, which is the built institution
 * overview at `/dashboard/admin`. This one is the Ticket 1.5 stub at `/admin/dashboard`.
 */
@Component({
  selector: 'app-admin-dashboard-page',
  imports: [PlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      heading="Admin dashboard"
      message="Admin Dashboard Coming Soon"
      route="/admin/dashboard"
    />
  `,
})
export class AdminDashboardPageComponent {}
