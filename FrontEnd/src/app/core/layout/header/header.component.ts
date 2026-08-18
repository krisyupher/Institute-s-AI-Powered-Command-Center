import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

/**
 * Top navigation bar for the shell: brand link plus the signed-in user's profile
 * badge (avatar + role tag), sourced entirely from the JWT the backend issued — there is
 * no way to change identity from this component other than signing in or out for real.
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
  protected readonly isAuthenticated = this.auth.isAuthenticated;

  /** Initials for the avatar placeholder, e.g. "Elena Rivera" -> "ER". */
  protected readonly initials = computed(() =>
    this.user()
      .fullName.split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join(''),
  );

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
