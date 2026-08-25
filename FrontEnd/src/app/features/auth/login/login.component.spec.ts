import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

const STUDENT: User = {
  id: 2,
  fullName: 'Ana Morales',
  email: 'student@humber.ca',
  role: 'Student',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

function setup(auth: Partial<AuthService>) {
  TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
  });

  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  return fixture;
}

describe('LoginComponent', () => {
  it('does not call login and shows validation errors when the form is invalid', () => {
    const login = vi.fn();
    const fixture = setup({ login, homeRoute: signal('/dashboard/student') });

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Email is required.');
  });

  it('logs in and navigates to the home route on success', () => {
    const login = vi.fn(() => of(STUDENT));
    const fixture = setup({ login, homeRoute: signal('/dashboard/student') });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const email: HTMLInputElement = fixture.nativeElement.querySelector('input[type="email"]');
    const password: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="password"]',
    );
    email.value = 'student@humber.ca';
    email.dispatchEvent(new Event('input'));
    password.value = 'Student123!';
    password.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(login).toHaveBeenCalledWith({ email: 'student@humber.ca', password: 'Student123!' });
    expect(navigateSpy).toHaveBeenCalledWith('/dashboard/student');
  });

  it('shows the backend error message when login fails with a message', () => {
    const httpError = new HttpErrorResponse({
      status: 401,
      error: { message: 'Invalid email or password.' },
    });
    const login = vi.fn(() => throwError(() => httpError));
    const fixture = setup({ login, homeRoute: signal('/dashboard/student') });

    const email: HTMLInputElement = fixture.nativeElement.querySelector('input[type="email"]');
    const password: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="password"]',
    );
    email.value = 'wrong@humber.ca';
    email.dispatchEvent(new Event('input'));
    password.value = 'nope';
    password.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'Invalid email or password.',
    );
  });

  it('shows an unreachable-server message when the request never reaches the API', () => {
    const httpError = new HttpErrorResponse({ status: 0 });
    const login = vi.fn(() => throwError(() => httpError));
    const fixture = setup({ login, homeRoute: signal('/dashboard/student') });

    const email: HTMLInputElement = fixture.nativeElement.querySelector('input[type="email"]');
    const password: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="password"]',
    );
    email.value = 'student@humber.ca';
    email.dispatchEvent(new Event('input'));
    password.value = 'Student123!';
    password.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain(
      'Cannot reach the server',
    );
  });
});
