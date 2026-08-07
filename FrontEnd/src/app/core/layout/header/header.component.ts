import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

/**
 * Top navigation bar for the shell: brand link plus the signed-in user's profile
 * badge (avatar + role tag). The role-switch dropdown is a mock-auth affordance kept
 * from the temporary shell so the demo can still flip between roles.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly role = this.auth.role;
  protected readonly roles: readonly UserRole[] = ['Student', 'Teacher', 'Admin'];

  /** Initials for the avatar placeholder, e.g. "Elena Rivera" -> "ER". */
  protected readonly initials = computed(() =>
    this.user()
      .fullName.split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join(''),
  );

  /** Demo role switch: change the role, then land on that role's dashboard. */
  protected switchRole(role: UserRole): void {
    this.auth.setRole(role);
    void this.router.navigateByUrl(this.auth.homeRoute());
  }
}
