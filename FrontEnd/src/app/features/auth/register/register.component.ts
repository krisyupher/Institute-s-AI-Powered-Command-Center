import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.model';
import { UserRole } from '../../../core/models/user.model';

/** Ticket 2.5: styled registration form wired to `AuthService.register()`. */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'register.component.html',
  styleUrl: 'register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly roles: readonly UserRole[] = ['Student', 'Teacher', 'Admin'];

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['Student', [Validators.required]],
  });

  protected get fullName() {
    return this.form.controls.fullName;
  }

  protected get email() {
    return this.form.controls.email;
  }

  protected get password() {
    return this.form.controls.password;
  }

  protected get role() {
    return this.form.controls.role;
  }

  protected submit(): void {
    if (this.submitting()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const request: RegisterRequest = {
      fullName: raw.fullName,
      email: raw.email,
      password: raw.password,
      role: raw.role as UserRole,
    };

    this.auth.register(request).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl(this.auth.homeRoute());
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.error.set(describeRegisterError(err));
      },
    });
  }
}

/** Maps a failed `AuthService.register()` into copy the alert can show as-is. */
function describeRegisterError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const message = (err.error as { message?: string } | null)?.message;
    if (message) return message;
    if (err.status === 0) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}