import { Injectable, computed, signal } from '@angular/core';

import { RoleName, User } from '../models/api.models';

const ROLE_KEY = 'institute.mockRole';

const MOCK_USERS: Record<RoleName, User> = {
  Student: {
    id: 'u1',
    email: 'ana.morales@institute.edu',
    fullName: 'Ana Morales',
    role: 'Student',
  },
  Teacher: {
    id: 'u2',
    email: 'e.rivera@institute.edu',
    fullName: 'Elena Rivera',
    role: 'Teacher',
  },
  Administrator: {
    id: 'u3',
    email: 'admin@institute.edu',
    fullName: 'Institution Admin',
    role: 'Administrator',
  },
  Staff: {
    id: 'u4',
    email: 'registrar@institute.edu',
    fullName: 'Registrar',
    role: 'Staff',
  },
};

/**
 * Stand-in for the real auth service until the API and login screen exist.
 *
 * It keeps the shape the rest of the app will depend on — `user`, `role`, `homeRoute`,
 * `hasRole` — but the role is simply chosen in the UI and remembered in localStorage
 * instead of coming from a JWT. Replacing this with the token-based implementation
 * should not require touching any component that reads these signals.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentRole = signal<RoleName>(this.readRole());

  readonly role = this.currentRole.asReadonly();
  readonly user = computed<User>(() => MOCK_USERS[this.currentRole()]);
  readonly isAuthenticated = computed(() => true);

  /** Where a signed-in user belongs, derived from their role. */
  readonly homeRoute = computed(() => {
    switch (this.role()) {
      case 'Student':
        return '/dashboard/student';
      case 'Teacher':
        return '/dashboard/teacher';
      case 'Administrator':
      case 'Staff':
        return '/dashboard/admin';
      default:
        return '/dashboard/student';
    }
  });

  hasRole(...roles: RoleName[]): boolean {
    return roles.includes(this.currentRole());
  }

  /** Demo affordance: lets the shell switch roles without a login round-trip. */
  setRole(role: RoleName): void {
    this.currentRole.set(role);
    localStorage.setItem(ROLE_KEY, role);
  }

  private readRole(): RoleName {
    const stored = localStorage.getItem(ROLE_KEY);
    return stored !== null && stored in MOCK_USERS ? (stored as RoleName) : 'Student';
  }
}
