import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth.service';

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
          { label: 'Dashboard', route: '/dashboard/teacher' },
          { label: 'Create AI Quiz', route: '/teacher/generator' },
          { label: 'My Quizzes', route: '/teacher/quizzes' },
        ];
      case 'Student':
        return [
          { label: 'Dashboard', route: '/dashboard/student' },
          { label: 'Available Quizzes', route: '/student/quizzes' },
          { label: 'My Results', route: '/student/results' },
        ];
      case 'Admin':
        return [{ label: 'Dashboard', route: '/admin/dashboard' }];
      default:
        return [];
    }
  });

  /**
   * Below `lg` the sidebar is a DaisyUI drawer overlay (`main-layout.component.html`)
   * driven by the `#app-drawer` checkbox; uncheck it on navigation so picking a link
   * closes the drawer instead of leaving it open over the new page. Above `lg` the
   * checkbox is irrelevant (`lg:drawer-open` forces the sidebar visible), so this is a
   * no-op there.
   */
  protected closeMobileDrawer(): void {
    const drawerToggle = document.getElementById('app-drawer');
    if (drawerToggle instanceof HTMLInputElement) {
      drawerToggle.checked = false;
    }
  }
}
