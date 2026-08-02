import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

interface NavItem {
  label: string;
  route: string;
}

/**
 * Side navigation for the shell. The links are role-specific, so the list is derived
 * from the current role (mock auth) and recomputed whenever the demo role changes.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  protected readonly navItems = computed<readonly NavItem[]>(() => {
    switch (this.auth.role()) {
      case 'Teacher':
        return [
          { label: 'Create AI Quiz', route: '/teacher/generator' },
          { label: 'My Quizzes', route: '/teacher/quizzes' },
        ];
      case 'Student':
        return [
          { label: 'Available Quizzes', route: '/student/quizzes' },
          { label: 'My Results', route: '/student/results' },
        ];
      case 'Administrator':
      case 'Staff':
        return [{ label: 'Dashboard', route: '/admin/dashboard' }];
      default:
        return [];
    }
  });
}
