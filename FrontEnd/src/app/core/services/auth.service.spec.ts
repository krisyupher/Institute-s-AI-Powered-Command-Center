import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService, TOKEN_KEY } from './auth.service';
import { environment } from '../../../environments/environment';
import { mintMockToken } from '../auth/jwt';

const CREDENTIALS = { email: 'e.rivera@institute.edu', password: 'Teacher123!' };

const TEACHER_TOKEN = mintMockToken({
  id: 1,
  fullName: 'Elena Rivera',
  email: 'e.rivera@institute.edu',
  role: 'Teacher',
});

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    auth: TestBed.inject(AuthService),
    backend: TestBed.inject(HttpTestingController),
  };
}

describe('AuthService', () => {
  beforeEach(() => localStorage.clear());

  it('starts signed out', () => {
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
    expect(auth.session()).toBeNull();
  });

  it('stores the JWT from POST /api/auth/login and exposes the session', async () => {
    const { auth, backend } = setup();

    const result = auth.login(CREDENTIALS);
    const pending = new Promise((resolve) => result.subscribe(resolve));

    const request = backend.expectOne(`${environment.apiBaseUrl}/api/auth/login`);
    expect(request.request.body).toEqual(CREDENTIALS);
    request.flush({
      token: TEACHER_TOKEN,
      email: CREDENTIALS.email,
      role: 'Teacher',
    });
    await pending;

    expect(localStorage.getItem(TOKEN_KEY)).toBe(TEACHER_TOKEN);
    expect(auth.token()).toBe(TEACHER_TOKEN);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.role()).toBe('Teacher');
    expect(auth.user().email).toBe(CREDENTIALS.email);
    expect(auth.homeRoute()).toBe('/dashboard/teacher');
  });

  it('propagates an unreachable backend as a real error instead of faking a session', async () => {
    const { auth, backend } = setup();

    const failure = new Promise((resolve) =>
      auth.login(CREDENTIALS).subscribe({ error: resolve }),
    );
    backend.expectOne(`${environment.apiBaseUrl}/api/auth/login`).error(new ProgressEvent('error'));
    await failure;

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('propagates a rejected credential instead of faking a session', async () => {
    const { auth, backend } = setup();

    const failure = new Promise((resolve) =>
      auth.login(CREDENTIALS).subscribe({ error: resolve }),
    );
    backend
      .expectOne(`${environment.apiBaseUrl}/api/auth/login`)
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await failure;

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('restores the session from localStorage on construction', () => {
    localStorage.setItem(TOKEN_KEY, TEACHER_TOKEN);
    const { auth } = setup();

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.session()?.fullName).toBe('Elena Rivera');
  });

  it.each(['not-a-jwt', 'a.b.c'])('treats %s in storage as signed out', (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('treats an expired token as signed out', () => {
    localStorage.setItem(
      TOKEN_KEY,
      mintMockToken(
        { id: 1, fullName: 'Elena Rivera', email: 'e.rivera@institute.edu', role: 'Teacher' },
        -1,
      ),
    );
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('clears the token on logout', () => {
    const { auth } = setup();
    auth.setRole('Admin');
    expect(auth.isAuthenticated()).toBe(true);

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('hasRole only answers true for the session role', () => {
    const { auth } = setup();
    auth.setRole('Student');

    expect(auth.hasRole('Student')).toBe(true);
    expect(auth.hasRole('Teacher', 'Admin')).toBe(false);
  });
});
