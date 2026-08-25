import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';

import { AdminDashboardPageComponent } from './admin-dashboard-page.component';

/**
 * This is currently the Ticket 1.5 placeholder wired to the real `/admin/dashboard`
 * route — see CLAUDE.md for the current-state note on the (separate) real admin
 * analytics dashboard landing here once it's wired up on this branch.
 */
describe('AdminDashboardPageComponent', () => {
  it('renders the "coming soon" placeholder for the admin dashboard route', () => {
    TestBed.configureTestingModule({ imports: [AdminDashboardPageComponent] });
    const fixture = TestBed.createComponent(AdminDashboardPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Admin dashboard');
    expect(fixture.nativeElement.textContent).toContain('Admin Dashboard Coming Soon');
    expect(fixture.nativeElement.textContent).toContain('/admin/dashboard');
  });
});
