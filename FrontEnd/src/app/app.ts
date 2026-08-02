import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { RoleName } from './core/models/api.models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly role = this.auth.role;
  protected readonly roles: readonly RoleName[] = ['Student', 'Teacher', 'Administrator'];

  /** Demo role switch: change the role, then land on that role's dashboard. */
  protected switchRole(role: RoleName): void {
    this.auth.setRole(role);
    void this.router.navigateByUrl(this.auth.homeRoute());
  }
}
