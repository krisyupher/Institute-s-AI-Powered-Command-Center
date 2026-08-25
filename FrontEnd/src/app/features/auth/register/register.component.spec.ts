import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

const NEW_TEACHER: User = {
  id: 9,
  fullName: 'Jane Doe',
  email: 'jane@humber.ca',
  role: 'Teacher',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

function setup(auth: Partial<AuthService>) {
  TestBed.configureTestingModule({
    imports: [RegisterComponent],
    providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
  });

  const fixture = TestBed.createComponent(RegisterComponent);
  fixture.detectChanges();
  return fixture;
}

function fillAndSubmit(
  fixture: ReturnType<typeof setup>,
  values: { fullName: string; email: string; password: string; role: string },
) {
  const nativeElement = fixture.nativeElement as HTMLElement;
  const fullName = nativeElement.querySelector('input[formcontrolname="fullName"]') as HTMLInputElement;
  const email = nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
  const password = nativeElement.querySelector('input[type="password"]') as HTMLInputElement;
  const role = nativeElement.querySelector('select[formcontrolname="role"]') as HTMLSelectElement;

  fullName.value = values.fullName;
  fullName.dispatchEvent(new Event('input'));
  email.value = values.email;
  email.dispatchEvent(new Event('input'));
  password.value = values.password;
  password.dispatchEvent(new Event('input'));
  role.value = values.role;
  role.dispatchEvent(new Event('change'));

  nativeElement.querySelector('form')!.dispatchEvent(new Event('submit'));
}

describe('RegisterComponent', () => {
  it('does not call register and shows validation errors when the form is invalid', () => {
    const register = vi.fn();
    const fixture = setup({ register, homeRoute: signal('/dashboard/teacher') });

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Full name is required.');
  });

  it('registers and navigates to the home route on success', () => {
    const register = vi.fn(() => of(NEW_TEACHER));
    const fixture = setup({ register, homeRoute: signal('/dashboard/teacher') });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillAndSubmit(fixture, {
      fullName: 'Jane Doe',
      email: 'jane@humber.ca',
      password: 'Teacher123!',
      role: 'Teacher',
    });

    expect(register).toHaveBeenCalledWith({
      fullName: 'Jane Doe',
      email: 'jane@humber.ca',
      password: 'Teacher123!',
      role: 'Teacher',
    });
    expect(navigateSpy).toHaveBeenCalledWith('/dashboard/teacher');
  });

  it('shows a conflict error message when the email is already registered', () => {
    const httpError = new HttpErrorResponse({
      status: 409,
      error: { message: 'An account with this email already exists.' },
    });
    const register = vi.fn(() => throwError(() => httpError));
    const fixture = setup({ register, homeRoute: signal('/dashboard/teacher') });

    fillAndSubmit(fixture, {
      fullName: 'Jane Doe',
      email: 'jane@humber.ca',
      password: 'Teacher123!',
      role: 'Teacher',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'An account with this email already exists.',
    );
  });
});
