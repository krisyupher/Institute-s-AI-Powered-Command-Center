import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

/** Sends each role to its own dashboard, so `/dashboard` works for everyone. */
@Component({
  selector: 'app-dashboard-redirect',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="muted">Loading your dashboard…</p>',
})
export class DashboardRedirectComponent {
  constructor() {
    const auth = inject(AuthService);
    const router = inject(Router);
    void router.navigateByUrl(auth.homeRoute());
  }
}
