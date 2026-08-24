import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AdminStats } from '../../../core/models/admin-stats.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly stats = signal<AdminStats | null>(null);

  ngOnInit(): void {
    this.adminService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the system analytics. Please try again shortly.');
        this.loading.set(false);
      },
    });
  }
}
