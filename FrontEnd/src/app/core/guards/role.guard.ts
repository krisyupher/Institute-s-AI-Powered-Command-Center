import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

// Where roles go when blocked
const ROLE_HOME: Record<UserRole, string> = {
  Student: '/student/quizzes',
  Teacher: '/teacher/quizzes',
  Admin: '/admin/dashboard',
};

/** Guard that checks user role and redirects if not allowed. */
export const roleGuard =
  (...allowedRoles: UserRole[]): CanActivateFn =>
  (_route, _state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (!auth.hasRole(...allowedRoles)) {
      return router.createUrlTree([ROLE_HOME[auth.role()]]);
    }

    return true;
  };